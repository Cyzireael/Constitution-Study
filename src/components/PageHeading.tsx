interface PageHeadingProps {
  english: string
  title: string
  description: string
}

export function PageHeading({ english, title, description }: PageHeadingProps) {
  return (
    <div className="page-heading">
      <div className="eyebrow">{english}</div>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  )
}
