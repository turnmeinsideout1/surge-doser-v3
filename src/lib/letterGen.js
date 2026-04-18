/**
 * Letter generation — produces { html, text } from selected drugs + calculated doses.
 */

function formatDate(dateStr, offsetDays) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d + offsetDays)
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function drugLine(name, dose, instructions, prnDose) {
  const displayName = name
  const base = `Please give <strong>${displayName}:</strong> <strong>${dose}</strong> ${instructions}`
  const baseText = `Please give ${displayName}: ${dose} ${instructions}`

  let html = `• ${base}`
  let text = `• ${baseText}`

  if (prnDose) {
    html += `<br>&nbsp;&nbsp;<em>If additional pain relief is needed, the dose may be increased to <strong>${prnDose}</strong> as needed.</em>`
    text += `\n  If additional pain relief is needed, the dose may be increased to ${prnDose} as needed.`
  }

  return { html, text }
}

function buildWeekLines(selectedDrugs, results, week2Only) {
  const lines = []

  for (const drug of selectedDrugs) {
    const result = results[drug.id]
    if (!result) continue
    if (week2Only && !drug.week2) continue

    const instructions = drug.patient_instructions || ''
    const displayName = result.conc ? `${drug.name} (${result.conc})` : drug.name

    if (result.warning) {
      let html = `• <strong>${displayName}:</strong> <span style="color:#b91c1c">No standard configuration within dose range — consult veterinarian.</span>`
      let text = `• ${displayName}: No standard configuration within dose range — consult veterinarian.`
      if (result.fallback) {
        html += `<br>&nbsp;&nbsp;Closest below range: <strong>${result.fallback}</strong>`
        text += `\n  Closest below range: ${result.fallback}`
      }
      if (result.alternative) {
        html += `<br>&nbsp;&nbsp;Slightly above range: <strong>${result.alternative}</strong>`
        text += `\n  Slightly above range: ${result.alternative}`
      }
      lines.push({ html, text })
    } else {
      lines.push(drugLine(displayName, result.suggestion, instructions, result.prn ?? null))
    }
  }

  return lines
}

export function generateLetter(patientName, surgeryDate, selectedDrugs, results) {
  const w1Start = formatDate(surgeryDate, 1)
  const w1End   = formatDate(surgeryDate, 7)
  const w2Start = formatDate(surgeryDate, 8)
  const w2End   = formatDate(surgeryDate, 14)

  let html = `Please give <strong>${patientName}</strong> the following medication:`
  let text = `Please give ${patientName} the following medication:`

  const week1Lines = buildWeekLines(selectedDrugs, results, false)
  if (week1Lines.length > 0) {
    html += `<br><br><strong><u>Week 1 (${w1Start} to ${w1End}):</u></strong><br><br>`
    html += week1Lines.map(l => l.html).join('<br><br>')
    text += `\n\nWeek 1 (${w1Start} to ${w1End}):\n\n`
    text += week1Lines.map(l => l.text).join('\n\n')
  }

  const week2Lines = buildWeekLines(selectedDrugs, results, true)
  if (week2Lines.length > 0) {
    html += `<br><br><strong><u>Week 2 (${w2Start} to ${w2End}):</u></strong><br><br>`
    html += week2Lines.map(l => l.html).join('<br><br>')
    text += `\n\nWeek 2 (${w2Start} to ${w2End}):\n\n`
    text += week2Lines.map(l => l.text).join('\n\n')
  }

  return { html, text }
}
