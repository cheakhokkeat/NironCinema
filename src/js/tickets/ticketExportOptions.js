export function chooseTicketExport(action = "save") {
  return new Promise((resolve) => {
    const dialog = document.createElement("dialog");
    dialog.className = "booking-alert";
    dialog.setAttribute("aria-label", "Save ticket");
    dialog.innerHTML = `
    <h2>Save ticket</h2><p>Choose your ticket style, colors and file format.</p><form>
      <fieldset class="ticket-export-field"><legend>Ticket style</legend>
        <label><input type="radio" name="style" value="simple"> Simple ticket</label>
        <label><input type="radio" name="style" value="poster" checked> Poster ticket</label>
      </fieldset>
      <fieldset class="ticket-export-field"><legend>Colors</legend>
        <label><input type="radio" name="color" value="full"> Full color · website colors</label>
        <label><input type="radio" name="color" value="light" checked> Light · print friendly</label>
      </fieldset>
      <fieldset class="ticket-export-field"><legend>File format</legend>
        <label><input type="radio" name="format" value="png" checked> Image (PNG)</label>
        <label><input type="radio" name="format" value="pdf"> PDF document</label>
      </fieldset><div class="booking-actions mt-4"><button type="button" data-cancel>Cancel</button><button type="submit" class="booking-primary">Download</button></div></form>`;
    const finish = (value) => {
      dialog.close();
      dialog.remove();
      resolve(value);
    };
    dialog.querySelector("[data-cancel]").onclick = () => finish(null);
    if (action === "share") {
      dialog.setAttribute("aria-label", "Share ticket");
      dialog.querySelector("h2").textContent = "Share ticket";
      dialog.querySelector('[type="submit"]').textContent = "Prepare ticket";
    }
    dialog.querySelector("form").onsubmit = (event) => {
      event.preventDefault();
      const values = new FormData(event.target);
      finish({
        style: values.get("style"),
        format: values.get("format"),
        color: values.get("color"),
      });
    };
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      finish(null);
    });
    document.body.append(dialog);
    dialog.showModal();
  });
}
