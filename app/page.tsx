// app/page.tsx
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

// ✅ Define Charity type manually (or import from generated Database types)
type Charity = {
  id: string
  name: string
  description: string
  image_url?: string
  is_featured: boolean
}

export default async function LandingPage() {
  const supabase = await createClient()

  // ✅ Just call .from('charities') without generics, then cast the data
  const { data } = await supabase
    .from('charities')
    .select('*')
    .eq('is_featured', true)
    .limit(3)

  const featuredCharities = data as Charity[] | null

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-indigo-500/30">
      {/* Navigation */}
      <nav className="absolute top-0 w-full flex justify-between items-center p-6 lg:px-12 z-50">
        <div className="text-xl font-bold tracking-tighter text-white">
          Impact<span className="text-indigo-500">Draw</span>
        </div>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="px-5 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/subscribe"
            className="px-5 py-2 text-sm font-medium bg-white text-slate-950 rounded-full hover:bg-slate-200 transition-colors"
          >
            Subscribe
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-6 lg:px-12 flex flex-col items-center text-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none"></div>

        <h1 className="text-5xl lg:text-7xl font-light tracking-tight max-w-4xl mb-6 leading-tight z-10">
          Make every round{' '}
          <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
            mean something.
          </span>
        </h1>
        <p className="text-lg lg:text-xl text-slate-400 max-w-2xl mb-10 z-10 font-light">
          A new kind of subscription. Track your performance, enter monthly prize pools, and automatically fund causes that change the world.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 z-10">
          <Link
            href="/subscribe"
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium text-lg transition-all shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)]"
          >
            Start Your Impact
          </Link>
          <Link
            href="#how-it-works"
            className="px-8 py-4 bg-slate-900 border border-slate-800 hover:border-slate-700 text-white rounded-full font-medium text-lg transition-all"
          >
            See How You Win
          </Link>
        </div>
      </section>

      {/* Featured Charities Section */}
      <section className="py-24 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-light mb-2">Causes You Can Back</h2>
              <p className="text-slate-400">Select your impact at signup.</p>
            </div>
            <Link
              href="/charities"
              className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
            >
              View Directory &rarr;
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {featuredCharities && featuredCharities.length > 0 ? (
              featuredCharities.map((charity) => (
                <div
                  key={charity.id}
                  className="group relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="h-48 bg-slate-800 w-full relative">
                    {charity.image_url && (
                      <img
                        src={charity.image_url}
                        alt={charity.name}
                        className="object-cover w-full h-full opacity-60 group-hover:opacity-100 transition-opacity"
                      />
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-medium mb-2">{charity.name}</h3>
                    <p className="text-sm text-slate-400 line-clamp-2">
                      {charity.description}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-3xl">
                Charity profiles are currently being updated.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}