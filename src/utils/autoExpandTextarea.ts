export const autoExpandTextarea = (textarea: HTMLTextAreaElement) => {
  textarea.style.height = 'auto'
  textarea.style.height = `${textarea.scrollHeight}px`
}

export const setupAutoExpandTextareas = () => {
  const textareas = document.querySelectorAll('textarea')
  
  textareas.forEach(textarea => {
    textarea.addEventListener('input', () => autoExpandTextarea(textarea))
    // Initialize height on load
    autoExpandTextarea(textarea)
  })
}
