import React from 'react'
import { getOrders, getOrdersStats } from './actions'
import OrdersClient from './OrdersClient'

export const dynamic = 'force-dynamic'

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; search?: string }>
}) {
  const searchParamsResolved = await searchParams;
  const page = parseInt(searchParamsResolved.page || '1', 10);
  const statusFilter = searchParamsResolved.status || 'الكل';
  const searchQuery = searchParamsResolved.search || '';

  const { orders, totalCount, totalPages, currentPage } = await getOrders(statusFilter, undefined, searchQuery, page, 50)
  const stats = await getOrdersStats()

  return (
    <OrdersClient 
      orders={orders} 
      stats={stats} 
      pagination={{ totalCount, totalPages, currentPage }} 
      initialStatus={statusFilter}
      initialSearch={searchQuery}
    />
  )
}
