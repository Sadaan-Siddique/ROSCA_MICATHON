export function DashboardSkeleton() {
  return (
    <section className="stack">
      <article className="card">
        <div className="skeleton-line title" />
        <div className="skeleton-line" />
        <div className="skeleton-line" />
      </article>
      <article className="card">
        <div className="skeleton-line title" />
        <div className="skeleton-list-item" />
        <div className="skeleton-list-item" />
        <div className="skeleton-list-item" />
      </article>
    </section>
  );
}

export function CommitteeSkeleton() {
  return (
    <section className="stack">
      <article className="card">
        <div className="skeleton-line title" />
        <div className="skeleton-line" />
        <div className="skeleton-line" />
        <div className="skeleton-line short" />
      </article>
      <article className="card">
        <div className="skeleton-line title" />
        <div className="skeleton-list-item" />
        <div className="skeleton-list-item" />
        <div className="skeleton-list-item" />
      </article>
    </section>
  );
}
