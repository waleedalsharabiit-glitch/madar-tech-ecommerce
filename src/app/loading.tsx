export default function HomeLoading() {
  return (
    <main className="home-loading" aria-busy="true" aria-live="polite">
      <div className="home-loading-hero">
        <div><span /><strong /><strong /><i /><i /></div>
        <div className="home-loading-art"><span /></div>
      </div>
      <div className="home-loading-cards"><i /><i /><i /></div>
      <p>جارٍ تجهيز مدار تك…</p>
    </main>
  );
}
