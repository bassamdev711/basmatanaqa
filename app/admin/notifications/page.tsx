'use client'

import { startTransition, useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  Bell,
  BellOff,
  Check,
  CheckCircle2,
  ExternalLink,
  Gauge,
  Loader2,
  Save,
  ShieldAlert,
  ShoppingBag,
} from 'lucide-react'
import {
  getNotificationSettings,
  markAllNotificationsRead,
  markNotificationRead,
  saveNotificationSettings,
} from './actions'

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index)
  }
  return outputArray
}

type NotificationItem = {
  id: string
  type: string
  title: string
  body: string
  url: string | null
  readAt: string | null
  createdAt: string
}

export default function NotificationsSettings() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [orderNotifications, setOrderNotifications] = useState(true)
  const [limitNotifications, setLimitNotifications] = useState(true)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  const applicationServerKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

  const loadSettings = useCallback(async () => {
    try {
      const result = await getNotificationSettings()
      if (result.success) {
        setOrderNotifications(result.preferences.orderNotifications)
        setLimitNotifications(result.preferences.limitNotifications)
        setNotifications(result.notifications)
      }
    } catch (loadError) {
      console.error('Notification settings load failed:', loadError)
      setError('تعذر تحميل إعدادات الإشعارات.')
    }
  }, [])

  const checkSubscription = useCallback(async () => {
    try {
      if (typeof window === 'undefined') return
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setError('متصفحك الحالي لا يدعم الإشعارات الفورية. افتح اللوحة في Safari أو Chrome.')
        return
      }

      const registration = await navigator.serviceWorker.register('/sw.js')
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        setIsSubscribed(true)
        return
      }

      if (Notification.permission === 'granted' && applicationServerKey) {
        try {
          const renewedSubscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(applicationServerKey),
          })
          const response = await fetch('/api/web-push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(renewedSubscription),
          })
          if (response.ok) setIsSubscribed(true)
        } catch (renewError) {
          console.error('Auto-resubscription failed:', renewError)
        }
      }
    } catch (subscriptionError) {
      console.error('Notification subscription check failed:', subscriptionError)
      setError('تعذر فحص حالة إشعارات الجهاز.')
    }
  }, [applicationServerKey])

  useEffect(() => {
    startTransition(() => {
      void Promise.all([loadSettings(), checkSubscription()]).finally(() => setLoading(false))
    })
  }, [checkSubscription, loadSettings])

  const handleSubscribe = async () => {
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      if (!applicationServerKey) throw new Error('مفاتيح الإشعارات غير مهيأة على الخادم.')
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('هذا المتصفح لا يدعم الإشعارات الفورية.')
      }

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') throw new Error('لم تتم الموافقة على إشعارات هذا الجهاز.')
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(applicationServerKey),
      })
      const response = await fetch('/api/web-push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      })
      if (!response.ok) throw new Error('فشل حفظ موافقة هذا الجهاز.')
      setIsSubscribed(true)
      setMessage('تم تفعيل إشعارات هذا الجهاز بنجاح.')
    } catch (subscribeError) {
      console.error('Subscription failed:', subscribeError)
      setError(subscribeError instanceof Error ? subscribeError.message : 'فشل تفعيل الإشعارات.')
    } finally {
      setLoading(false)
    }
  }

  const handleUnsubscribe = async () => {
    setLoading(true)
    setError(null)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
        await fetch('/api/web-push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
      }
      setIsSubscribed(false)
      setMessage('تم إيقاف إشعارات هذا الجهاز فقط.')
    } catch (unsubscribeError) {
      console.error('Unsubscribe failed:', unsubscribeError)
      setError('فشل إيقاف إشعارات هذا الجهاز.')
    } finally {
      setLoading(false)
    }
  }

  const handleSavePreferences = async () => {
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const result = await saveNotificationSettings({ orderNotifications, limitNotifications })
      if (!result.success) throw new Error('تعذر حفظ التفضيلات.')
      setMessage('تم حفظ تفضيلات الإشعارات.')
    } catch (saveError) {
      console.error('Notification preference save failed:', saveError)
      setError(saveError instanceof Error ? saveError.message : 'تعذر حفظ التفضيلات.')
    } finally {
      setSaving(false)
    }
  }

  const handleMarkRead = async (notification: NotificationItem) => {
    if (notification.readAt) return
    setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item))
    await markNotificationRead(notification.id)
  }

  const handleMarkAllRead = async () => {
    setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })))
    await markAllNotificationsRead()
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-brand mb-2">إعدادات الإشعارات</h1>
        <p className="text-gray-600">تحكم في إشعارات الطلبات وحدود الاستخدام داخل اللوحة وعلى أجهزة المدير.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 border border-red-100">
          <ShieldAlert size={20} className="shrink-0" />
          <p className="font-bold text-sm">{error}</p>
        </div>
      )}
      {message && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl flex items-center gap-3 border border-emerald-100">
          <CheckCircle2 size={20} className="shrink-0" />
          <p className="font-bold text-sm">{message}</p>
        </div>
      )}

      <section className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-deep-green flex items-center gap-2"><Bell size={22} /> أنواع الإشعارات</h2>
            <p className="text-sm text-gray-500 mt-2">تطبق هذه الاختيارات على الإشعارات داخل اللوحة وعلى Push، ولا ترسل بريدًا إلكترونيًا.</p>
          </div>
          <button onClick={handleSavePreferences} disabled={saving} className="btn btn-primary flex items-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            حفظ
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PreferenceToggle
            enabled={orderNotifications}
            onChange={setOrderNotifications}
            icon={<ShoppingBag size={22} />}
            title="إشعارات الطلبات"
            description="طلب جديد وإثبات دفع جديد."
          />
          <PreferenceToggle
            enabled={limitNotifications}
            onChange={setLimitNotifications}
            icon={<Gauge size={22} />}
            title="إشعارات حدود الاستخدام"
            description="تنبيهات 70% و85% و95% وبلوغ الحصة."
          />
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-deep-green flex items-center gap-2"><Bell size={22} /> إشعارات هذا الجهاز</h2>
            <p className="text-sm text-gray-500 mt-2">تحتاج موافقة المتصفح. يمكن تفعيل كل هاتف أو لابتوب بشكل مستقل.</p>
          </div>
          {isSubscribed ? <CheckCircle2 className="text-emerald-600" /> : <BellOff className="text-gray-400" />}
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 rounded-xl bg-gray-50 p-5">
          <div>
            <p className="font-bold text-deep-green">{isSubscribed ? 'الإشعارات مفعلة على هذا الجهاز' : 'الإشعارات غير مفعلة على هذا الجهاز'}</p>
            <p className="text-sm text-gray-500 mt-1">لن تظهر للعميل، وتصل فقط إلى جهاز المدير الذي وافق عليها.</p>
          </div>
          {loading ? (
            <button disabled className="btn btn-secondary opacity-60"><Loader2 size={18} className="animate-spin" /> جاري التحقق</button>
          ) : isSubscribed ? (
            <button onClick={handleUnsubscribe} className="px-5 py-2.5 rounded-xl bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 transition-colors">إيقاف هذا الجهاز</button>
          ) : (
            <button onClick={handleSubscribe} className="btn btn-primary flex items-center gap-2"><Bell size={18} /> تفعيل هذا الجهاز</button>
          )}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-bold text-deep-green">سجل الإشعارات داخل اللوحة</h2>
            <p className="text-sm text-gray-500 mt-1">سجل محفوظ للمدير حتى لا تضيع التنبيهات عند إغلاق المتصفح.</p>
          </div>
          {notifications.some((notification) => !notification.readAt) && (
            <button onClick={handleMarkAllRead} className="text-sm font-bold text-brand hover:underline">تحديد الكل كمقروء</button>
          )}
        </div>
        {notifications.length === 0 ? (
          <div className="py-12 text-center text-gray-500">لا توجد إشعارات جديدة حتى الآن.</div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => {
                  void handleMarkRead(notification)
                  if (notification.url) window.location.href = notification.url
                }}
                className={`w-full text-right rounded-xl border p-4 flex items-start gap-3 transition-colors ${notification.readAt ? 'border-gray-100 bg-white' : 'border-brand/20 bg-brand/5'}`}
              >
                <span className={`mt-0.5 p-2 rounded-lg ${notification.type === 'limit' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                  {notification.type === 'limit' ? <Gauge size={18} /> : <ShoppingBag size={18} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-bold text-deep-green">{notification.title}</span>
                    {!notification.readAt && <span className="w-2 h-2 rounded-full bg-brand shrink-0" />}
                  </span>
                  <span className="block text-sm text-gray-600 mt-1">{notification.body}</span>
                  <span className="block text-xs text-gray-400 mt-2">{formatDate(notification.createdAt)}</span>
                </span>
                {notification.url && <ExternalLink size={16} className="text-gray-400 shrink-0 mt-1" />}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function PreferenceToggle({
  enabled,
  onChange,
  icon,
  title,
  description,
}: {
  enabled: boolean
  onChange: (value: boolean) => void
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <button type="button" onClick={() => onChange(!enabled)} className="text-right rounded-xl border border-gray-100 p-5 hover:border-brand/30 transition-colors flex items-start gap-3">
      <span className={`p-2 rounded-lg ${enabled ? 'bg-brand/10 text-brand' : 'bg-gray-100 text-gray-400'}`}>{icon}</span>
      <span className="flex-1">
        <span className="flex items-center justify-between gap-3">
          <span className="font-bold text-deep-green">{title}</span>
          <span className={`w-10 h-6 rounded-full p-1 transition-colors ${enabled ? 'bg-brand' : 'bg-gray-300'}`}>
            <span className={`block w-4 h-4 bg-white rounded-full transition-transform ${enabled ? '-translate-x-4' : 'translate-x-0'}`} />
          </span>
        </span>
        <span className="block text-sm text-gray-500 mt-2">{description}</span>
        <span className="inline-flex items-center gap-1 text-xs font-bold mt-3 text-gray-500">{enabled && <Check size={13} />} {enabled ? 'مفعّل' : 'متوقف'}</span>
      </span>
    </button>
  )
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat('ar', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  } catch {
    return value
  }
}
