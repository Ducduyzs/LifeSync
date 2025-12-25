document.addEventListener("DOMContentLoaded", () => {
  const input = document.querySelector(".search-input")
  const box = document.getElementById("searchResultBox")

  if (!input || !box) return

  const normalize = s => s.toLowerCase().trim()

  // INPUT EVENT
  input.addEventListener("input", () => {
    const q = normalize(input.value)
    box.innerHTML = ""

    if (!q) {
      box.classList.add("hidden")
      return
    }

    const tasks = document.querySelectorAll(".task-item")
    let count = 0

    tasks.forEach(t => {
      if (count >= 5) return

      const text = normalize(t.innerText)
      if (!text.includes(q)) return

      const checkbox = t.querySelector("input[type='checkbox']")
      const taskId = checkbox?.dataset.id
      if (!taskId) return

      const title =
        t.querySelector(".font-medium")?.innerText ||
        "Task"

      const time =
        t.querySelector(".bi-clock")?.parentElement?.innerText || ""

      const tag = t.innerText.match(/#\w+/)?.[0] || ""

      const div = document.createElement("div")
      div.className = "search-item"
      div.dataset.taskId = taskId

      div.innerHTML = `
        <span class="search-inline-title">${title}</span>
        <span class="search-inline-meta">${time} ${tag}</span>
      `

      box.appendChild(div)
      count++
    })

    box.classList.toggle("hidden", count === 0)
  })

  // ENTER KEY → OPEN FIRST RESULT
  input.addEventListener("keydown", e => {
    if (e.key !== "Enter") return
    e.preventDefault()

    const first = box.querySelector(".search-item")
    if (!first) return

    openTaskFromSearch(first)
  })

  // CLICK RESULT
  box.addEventListener("click", e => {
    e.preventDefault()
    e.stopPropagation()

    const item = e.target.closest(".search-item")
    if (!item) return

    openTaskFromSearch(item)
  })

  // CLICK OUTSIDE
  document.addEventListener("click", e => {
    if (!e.target.closest(".search-container")) {
      box.classList.add("hidden")
    }
  })

  // ===== CORE OPEN LOGIC =====
  function openTaskFromSearch(item) {
    const taskId = item.dataset.taskId
    if (!taskId) return

    const checkbox = document.querySelector(
      `input[type="checkbox"][data-id="${taskId}"]`
    )
    if (!checkbox) return

    const taskItem = checkbox.closest(".task-item")
    if (!taskItem) return

    taskItem.scrollIntoView({ behavior: "smooth", block: "center" })

    taskItem.classList.add("ring", "ring-pink-300")
    setTimeout(() => {
      taskItem.classList.remove("ring", "ring-pink-300")
    }, 1200)

    taskItem.click()
    box.classList.add("hidden")
  }
})
