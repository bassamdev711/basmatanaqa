'use client';

import React from 'react';
import { ProductQueueProvider } from './ProductQueueContext';
import QueueStatusWidget from './QueueStatusWidget';

export default function AdminQueueWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ProductQueueProvider>
      {children}
      <QueueStatusWidget />
    </ProductQueueProvider>
  );
}
