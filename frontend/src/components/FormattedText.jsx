import { Fragment } from 'react'

const TOKEN = /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|`[^`\n]+`)/g

export default function FormattedText({ text = '' }) {
  return String(text)
    .split(TOKEN)
    .map((parte, indice) => {
      if (parte.length > 2 && parte.startsWith('*') && parte.endsWith('*')) {
        return <strong key={indice}>{parte.slice(1, -1)}</strong>
      }
      if (parte.length > 2 && parte.startsWith('_') && parte.endsWith('_')) {
        return <em key={indice}>{parte.slice(1, -1)}</em>
      }
      if (parte.length > 2 && parte.startsWith('~') && parte.endsWith('~')) {
        return <s key={indice}>{parte.slice(1, -1)}</s>
      }
      if (parte.length > 2 && parte.startsWith('`') && parte.endsWith('`')) {
        return <code key={indice}>{parte.slice(1, -1)}</code>
      }
      return <Fragment key={indice}>{parte}</Fragment>
    })
}
