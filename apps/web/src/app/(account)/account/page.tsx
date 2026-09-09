import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "个人中心",
  description: "网盘妹登录后的个人页面。",
};

export default function AccountPage() {
  return (
    <main
      id="main"
      className="page-shell py-[clamp(1.5rem,1rem+2vw,2.5rem)] pb-[max(2rem,env(safe-area-inset-bottom))]"
    >
      <div className="page-prose">
        <h1 className="text-[clamp(1.5rem,1.3rem+1vw,1.75rem)] font-semibold">
          个人中心
        </h1>
        <p className="mt-2 text-muted-foreground">已登录。业务页面从这里加。</p>
      </div>
    </main>
  );
}
