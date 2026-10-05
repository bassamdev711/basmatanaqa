-- General template defaults for new store installations.
-- Existing StoreSettings and HomepageSettings rows are intentionally preserved.

ALTER TABLE "StoreSettings"
  ALTER COLUMN "currencyCode" SET DEFAULT 'USD';

ALTER TABLE "HomepageSettings"
  ALTER COLUMN "heroTitle" SET DEFAULT 'متجرك',
  ALTER COLUMN "heroDescription" SET DEFAULT 'اكتشف مجموعتنا المختارة بعناية، المصممة لتمنحك تجربة تسوق واضحة وفريدة.',
  ALTER COLUMN "heroPrimaryButton" SET DEFAULT 'اكتشف المنتجات',
  ALTER COLUMN "heroSecondaryButton" SET DEFAULT 'اعرف المزيد',
  ALTER COLUMN "aboutTopTitle" SET DEFAULT 'هوية المتجر',
  ALTER COLUMN "aboutQuote" SET DEFAULT '"نختار منتجاتنا بعناية لنقدم لك تجربة واضحة ومميزة."',
  ALTER COLUMN "aboutDescription" SET DEFAULT 'نقدم منتجات مختارة بعناية، وخدمة موثوقة، وتجربة تسوق بسيطة تناسب احتياجات عملائنا.',
  ALTER COLUMN "expTopTitle" SET DEFAULT 'قيمنا',
  ALTER COLUMN "expMainTitle" SET DEFAULT 'تجربة تسوق أفضل',
  ALTER COLUMN "expBox1Title" SET DEFAULT 'اختيار واضح',
  ALTER COLUMN "expBox1Desc" SET DEFAULT 'نوضح تفاصيل منتجاتنا وأسعارها وخياراتها حتى تتخذ قرارك بثقة.',
  ALTER COLUMN "expBox2Title" SET DEFAULT 'خدمة موثوقة',
  ALTER COLUMN "expBox2Desc" SET DEFAULT 'نرافقك قبل الشراء وبعده من خلال قنوات تواصل واضحة وتجربة طلب آمنة.',
  ALTER COLUMN "statsJson" SET DEFAULT '[{"value":"01","label":"اختيار واضح"},{"value":"02","label":"خدمة موثوقة"},{"value":"03","label":"تجربة سهلة"},{"value":"04","label":"دعم مستمر"}]';
