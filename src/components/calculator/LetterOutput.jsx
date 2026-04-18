export default function LetterOutput({ html, text, onCopy }) {
  function copyPlain() {
    navigator.clipboard.writeText(text)
    onCopy('plain')
  }

  function copyFormatted() {
    const blob = new Blob([html], { type: 'text/html' })
    const plain = new Blob([text], { type: 'text/plain' })
    navigator.clipboard.write([new ClipboardItem({ 'text/html': blob, 'text/plain': plain })])
    onCopy('formatted')
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-4">
        {html ? (
          <div
            className="text-sm text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <span className="text-gray-400 italic text-sm">
            Enter patient details and select medications to generate dosing instructions.
          </span>
        )}
      </div>

      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-3">
        ⚠️ These are draft calculations only. All doses should be verified by a qualified staff before administration.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={copyPlain} disabled={!html}
          className="py-2.5 rounded-md font-semibold text-white text-sm tracking-wide hover:opacity-90 transition-opacity disabled:opacity-30"
          style={{ backgroundColor: '#2b6cb0' }}>
          Copy Plain Text
        </button>
        <button
          onClick={copyFormatted} disabled={!html}
          className="py-2.5 rounded-md font-semibold text-white text-sm tracking-wide hover:opacity-90 transition-opacity disabled:opacity-30"
          style={{ backgroundColor: '#1a365d' }}>
          Copy Formatted
        </button>
      </div>
    </>
  )
}
