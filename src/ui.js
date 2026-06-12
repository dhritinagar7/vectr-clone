export function initUI() {
  // FAQ accordion
  for (const item of document.querySelectorAll('.faq__item')) {
    const button = item.querySelector('.faq__question')
    button.addEventListener('click', () => {
      const isOpen = item.classList.toggle('open')
      button.setAttribute('aria-expanded', String(isOpen))
    })
  }

  // Scroll CTA jumps past the hero into the flow section
  const cta = document.querySelector('.hero__scroll-cta')
  cta?.addEventListener('click', () => {
    document.querySelector('.flow')?.scrollIntoView({ behavior: 'smooth' })
  })
}
