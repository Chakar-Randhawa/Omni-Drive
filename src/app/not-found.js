import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-[#5B5BD6]/10 text-[#5B5BD6] flex items-center justify-center mx-auto text-2xl font-extrabold">
        404
      </div>
      <h1 className="text-2xl font-bold text-[#111827]">Page Not Found</h1>
      <p className="text-sm text-[#4B5563]">
        The tool or page you requested could not be located.
      </p>
      <Link
        href="/"
        className="inline-block px-5 py-2.5 bg-[#5B5BD6] text-white rounded-xl text-sm font-semibold hover:bg-[#4949B8] transition-colors"
      >
        Return to All Tools
      </Link>
    </div>
  );
}
