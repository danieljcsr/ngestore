import Image from "next/image";

export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-12">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <Image
          src="/logo/ngestore-logo-dark.svg"
          alt="NgeStore"
          width={160}
          height={40}
          priority
        />
        {children}
      </div>
    </div>
  );
}
