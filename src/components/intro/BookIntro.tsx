import "./book-intro.css";

/** A self-contained, non-interactive curtain over the existing landing page. */
export function BookIntro() {
  return (
    <div className="book-intro" role="img" aria-label="SR LUMINA book opening to reveal the website">
      <div className="book-intro__ambient" aria-hidden="true" />
      <div className="book-intro__camera" aria-hidden="true">
        <div className="book-intro__shadow" />
        <div className="book-intro__volume">
          <div className="book-intro__back" />
          <div className="book-intro__spine" />
          <div className="book-intro__right-edge" />
          <div className="book-intro__right-page">
            <div className="book-intro__page-light" />
            <div className="book-intro__identity">
              <span className="book-intro__identity-mark">S</span>
              <span className="book-intro__identity-name">SR LUMINA</span>
              <span className="book-intro__identity-line">Your preparation. Your progress.</span>
            </div>
          </div>
          <div className="book-intro__leaf book-intro__leaf--third" />
          <div className="book-intro__leaf book-intro__leaf--second" />
          <div className="book-intro__leaf book-intro__leaf--first" />
          <div className="book-intro__cover">
            <div className="book-intro__cover-front">
              <div className="book-intro__cover-grain" />
              <div className="book-intro__cover-label">
                <span className="book-intro__cover-rule" />
                <span>SR LUMINA</span>
                <span className="book-intro__cover-subtitle">A NEW CHAPTER BEGINS</span>
              </div>
              <div className="book-intro__sweep" />
            </div>
            <div className="book-intro__cover-inside" />
          </div>
        </div>
      </div>
      <div className="book-intro__veil" aria-hidden="true" />
    </div>
  );
}