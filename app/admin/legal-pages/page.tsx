import { getLegalPages } from './actions'
import LegalPagesClient from './LegalPagesClient'

export const dynamic = 'force-dynamic'

export default async function LegalPagesPage() {
  const pages = await getLegalPages()
  return <LegalPagesClient initialPages={pages} />
}
