import { LegalShell } from "@/components/legal-shell";

const contentClass =
  "!text-slate-700 leading-relaxed " +
  "[&_h1]:mb-3 [&_h1]:text-4xl [&_h1]:font-bold [&_h1]:!text-slate-900 " +
  "[&_h2]:mb-2 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:!text-slate-900 " +
  "[&>p]:my-4 " +
  "[&>ul]:my-4 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1.5 " +
  "[&_strong]:font-semibold [&_strong]:!text-slate-900 " +
  "[&_a]:font-medium [&_a]:!text-sky-700 [&_a:hover]:underline";

export default function TermsPage() {
  return (
    <LegalShell>
      <div className={contentClass}>
        <h1>terms of use</h1>

        <p className="text-lg text-slate-500">
          hey! by using wieder, you&rsquo;re agreeing to the basic rules below. nothing wild, just some ground rules to keep things running smoothly for everyone.
        </p>

        <h2>1. using the app</h2>
        <p>
          you&rsquo;re welcome to use wieder for personal study and learning. feel free to save and review your sets, but please don&rsquo;t:
        </p>
        <ul>
          <li>try to hack or reverse engineer the code</li>
          <li>remove credit or branding</li>
        </ul>
        <p>
          if you break the rules, we might have to cut off your access. just use the site normally please.
        </p>

        <h2>2. just a heads up</h2>
        <p>
          wieder is provided as-is. we can&rsquo;t promise it&rsquo;ll always be bug-free or perfect. use it at your own discretion.
        </p>

        <h2>3. liability</h2>
        <p>
          we&rsquo;re not liable for any losses, tech issues, or data problems that might happen while using wieder. please back up your stuff and use the app responsibly.
        </p>

        <h2>4. don&rsquo;t abuse the app</h2>
        <p>please don&rsquo;t spam sets, troll, or try to break the system.</p>

        <h2>5. terms might change</h2>
        <p>we might update these terms from time to time.</p>

        <p>thanks for using wieder 💛</p>
      </div>
    </LegalShell>
  );
}
