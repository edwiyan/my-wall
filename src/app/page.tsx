import Wall from "@/components/Wall";
import { profile } from "@/lib/profile";

export default function Home() {
  return (
    <div className="min-h-full">
      <header className="bg-[#3b5998]">
        <div className="mx-auto flex h-10 max-w-[980px] items-center px-4">
          <span className="text-xl font-bold tracking-tight text-white">wall</span>
        </div>
      </header>

      <main className="mx-auto flex max-w-[980px] flex-col gap-5 px-4 py-5 md:flex-row">
        <aside className="flex shrink-0 gap-4 md:w-[200px] md:flex-col md:gap-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- static profile photo */}
          <img
            src={profile.photo}
            alt={`${profile.name}'s profile photo`}
            className="w-24 border border-[#d8dfea] object-cover md:w-[200px]"
          />
          <dl className="md:mt-4">
            <dt className="hidden border-b border-[#d8dfea] bg-[#eceff5] px-2 py-1 font-bold text-[#333] md:block">
              Information
            </dt>
            {profile.info.map((row) => (
              <div key={row.label} className="py-1 md:px-2">
                <dt className="text-[11px] text-[#777]">{row.label}</dt>
                <dd className="text-[#333]">{row.value}</dd>
              </div>
            ))}
          </dl>
        </aside>

        <div className="min-w-0 flex-1">
          <h1 className="mb-3 text-lg font-bold text-[#333]">{profile.name}</h1>
          <Wall />
        </div>
      </main>
    </div>
  );
}
