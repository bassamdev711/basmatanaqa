import React from 'react'
import { getOrders, getOrdersStats } from './actions'
import OrdersClient from './OrdersClient'

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  const orders = await getOrders()
  const stats = await getOrdersStats()

  return (
    <OrdersClient orders={orders} stats={stats} />
  )
}
