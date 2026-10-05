"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin } from "lucide-react";
import { submitContactMessage } from "@/app/actions/contact";
import { useToast } from "@/components/ToastProvider";

type ContactData = {
  phoneNumber?: string | null
  showPhoneNumber?: boolean | null
  emailAddress?: string | null
  showEmailAddress?: boolean | null
  address?: string | null
  showAddress?: boolean | null
}

export default function ContactClient({ contactData }: { contactData?: ContactData | null }) {
  const phone = contactData?.phoneNumber || '+967 777 777 777'
  const showPhone = contactData?.showPhoneNumber !== false
  const email = contactData?.emailAddress || 'hello@example-store.com'
  const showEmail = contactData?.showEmailAddress !== false
  const address = contactData?.address || 'صنعاء، الجمهورية اليمنية'
  const showAddress = contactData?.showAddress !== false

  const [formData, setFormData, ] = useState({ name: "", phone: "", email: "", message: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    const result = await submitContactMessage(formData)
    setIsSubmitting(false)

    if (result.success) {
      showToast("success", result.message || "تم الإرسال بنجاح")
      setFormData({ name: "", phone: "", email: "", message: "" })
    } else {
      showToast("error", result.error || "حدث خطأ ما")
    }
  }

  return (
    <section id="contact" className="py-24 md:py-32 bg-surface">
      <div className="max-w-7xl mx-auto px-6 lg:px-12" dir="rtl">
        <div className="text-center mb-20">
          <span className="text-accent tracking-[0.3em] uppercase text-xs font-bold mb-4 block">
            دائماً في خدمتك
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-foreground mb-6">تواصل معنا</h2>
          <div className="w-16 h-[2px] bg-brand mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-12"
          >
            <div>
              <h3 className="text-3xl font-black text-foreground mb-4">يسعدنا الاستماع إليك</h3>
              <p className="text-foreground/70 font-light leading-relaxed">
                سواء كان لديك استفسار عن منتجاتنا، أو تحتاج إلى مساعدة في اختيار ما يناسبك، أو لديك أي سؤال آخر، فإن فريق خدمة العملاء مستعد دائمًا لتقديم المساعدة.
              </p>
            </div>

            <div className="space-y-8">
              {showPhone && (
                <div className="flex items-start gap-6 group">
                  <div className="w-14 h-14 rounded-full bg-brand/5 flex items-center justify-center text-brand group-hover:bg-brand group-hover:text-surface transition-colors">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-foreground font-bold mb-2">رقم الهاتف / واتساب</h4>
                    <p className="text-foreground/60 font-light" dir="ltr">{phone}</p>
                  </div>
                </div>
              )}

              {showEmail && (
                <div className="flex items-start gap-6 group">
                  <div className="w-14 h-14 rounded-full bg-brand/5 flex items-center justify-center text-brand group-hover:bg-brand group-hover:text-surface transition-colors">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-foreground font-bold mb-2">البريد الإلكتروني</h4>
                    <p className="text-foreground/60 font-light">{email}</p>
                  </div>
                </div>
              )}

              {showAddress && (
                <div className="flex items-start gap-6 group">
                  <div className="w-14 h-14 rounded-full bg-brand/5 flex items-center justify-center text-brand group-hover:bg-brand group-hover:text-surface transition-colors">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-foreground font-bold mb-2">المقر الرئيسي</h4>
                    <p className="text-foreground/60 font-light">{address}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-white p-8 md:p-12 shadow-sm border border-black/5"
          >
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-foreground text-sm font-bold mb-2">الاسم الكريم</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-surface-alt border border-black/5 text-foreground px-4 py-3 focus:outline-none focus:border-brand/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-foreground text-sm font-bold mb-2">رقم الهاتف</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-surface-alt border border-black/5 text-foreground px-4 py-3 focus:outline-none focus:border-brand/30 transition-colors"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-foreground text-sm font-bold mb-2">البريد الإلكتروني</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-surface-alt border border-black/5 text-foreground px-4 py-3 focus:outline-none focus:border-brand/30 transition-colors"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-foreground text-sm font-bold mb-2">رسالتك</label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-surface-alt border border-black/5 text-foreground px-4 py-3 focus:outline-none focus:border-brand/30 transition-colors resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand text-surface font-bold py-4 hover:bg-foreground transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "جاري الإرسال..." : "إرسال الرسالة"}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
