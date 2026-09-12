import ExchangeRateTicker from './ExchangeRateTicker'
import LanguageSelect from './LanguageSelect'

export default function Toolbar({ language, onLanguageChange }) {
  return (
    <div className="toolbar">
      <ExchangeRateTicker language={language} />
      <div className="toolbar-actions">
        <LanguageSelect value={language} onChange={onLanguageChange} />
      </div>
    </div>
  )
}
