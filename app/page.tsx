import { Link } from "@nextui-org/link";
import { button as buttonStyles } from "@nextui-org/theme";
import { title, subtitle } from "@/components/primitives";

export default function Home() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">
        <span className={title()}>TULPAR&nbsp;</span>
        <span className={title({ color: "violet" })}>EXPRESS&nbsp;</span>
        <br />
        <span className={title()}>
          Оптимизация международной логистики
        </span>
        <div className={subtitle({ class: "mt-4" })}>
          Быстрая и надежная доставка посылок по всему миру
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          href="/auth/login"
          className={buttonStyles({ color: "primary", radius: "full", variant: "shadow" })}
        >
          Войти
        </Link>
        <Link
          href="/about"
          className={buttonStyles({ variant: "bordered", radius: "full" })}
        >
          О нас
        </Link>
      </div>
    </section>
  );
}
