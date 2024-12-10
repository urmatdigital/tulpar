import { useTheme } from "next-themes";
import Image from "next/image";
import { useEffect, useState } from "react";

export const TulparLogo = () => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const logoSrc = theme === "dark" 
    ? "/tulpar_text_logo_light.svg"
    : "/tulpar_text_logo_dark.svg";

  return (
    <div className="flex items-center gap-2">
      <Image
        src="/tulpar195X195.png"
        alt="Tulpar Logo"
        width={36}
        height={36}
        className="rounded-full"
        priority
      />
      <Image
        src={logoSrc}
        alt="Tulpar"
        width={120}
        height={28}
        className="hidden sm:block dark:invert"
        priority
      />
    </div>
  );
};
