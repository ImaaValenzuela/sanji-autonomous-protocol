import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-ember">Sanji</p>
      <h1 className="mt-4 font-display text-5xl text-cream">Esa mesa no está en la carta.</h1>
      <p className="mt-4 text-ash">El slug no coincide con ningún local de CABA en el protocolo.</p>
      <Link href="/" className="mt-8 text-sm text-cream underline decoration-ember underline-offset-4">
        Volver al command center
      </Link>
    </main>
  );
}
