'use client'

import { useEffect } from 'react'

export default function HomepageScrollRestorer() {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const lastPath = sessionStorage.getItem('basmatanaqa_last_path')
        const lastScrollY = sessionStorage.getItem('basmatanaqa_last_scroll_y')
        const lastClicked = sessionStorage.getItem('basmatanaqa_last_clicked_product')

        if (lastPath === '/' || !lastPath) {
          if (lastClicked || lastScrollY) {
            const targetY = lastScrollY ? parseInt(lastScrollY, 10) : null

            const attemptScroll = (retries: number) => {
              let scrolled = false

              if (lastClicked) {
                const el = document.getElementById(`product-${lastClicked}`)
                if (el) {
                  el.scrollIntoView({ block: 'center', behavior: 'instant' })
                  sessionStorage.removeItem('basmatanaqa_last_clicked_product')
                  sessionStorage.removeItem('basmatanaqa_last_scroll_y')
                  scrolled = true
                }
              }

              if (!scrolled && targetY !== null && !isNaN(targetY) && targetY > 0) {
                window.scrollTo({ top: targetY, behavior: 'instant' })
                sessionStorage.removeItem('basmatanaqa_last_scroll_y')
                sessionStorage.removeItem('basmatanaqa_last_clicked_product')
                scrolled = true
              }

              if (!scrolled && retries > 0) {
                setTimeout(() => attemptScroll(retries - 1), 70)
              }
            }

            setTimeout(() => attemptScroll(8), 60)
          }
        }
      }
    } catch (e) {
      // Ignore
    }
  }, [])

  return null
}
