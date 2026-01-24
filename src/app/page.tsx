"use client"

export default function LandingPage() {
  return (
    <iframe
      src="/landing-bg.html"
      className="w-full h-screen border-0"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        border: 'none'
      }}
      title="Wieder Landing Page"
    />
  )
}
