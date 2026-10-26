"use client";

export default function HomeError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="home-fatal-error" role="alert">
      <span aria-hidden="true">!</span>
      <h1>تعذر عرض الصفحة الآن</h1>
      <p>حدث خطأ أثناء تحميل الصفحة. حاول مرة أخرى بعد قليل.</p>
      <button className="home-button home-button-primary" onClick={reset} type="button">إعادة المحاولة <b aria-hidden="true">↻</b></button>
    </main>
  );
}
