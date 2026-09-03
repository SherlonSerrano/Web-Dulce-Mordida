// ✅ Función para incluir HTML de forma recursiva con callback
function includeHTML(callback) {
    var z, i, elmnt, file, xhttp;
    z = document.getElementsByTagName("*");
    for (i = 0; i < z.length; i++) {
        elmnt = z[i];
        file = elmnt.getAttribute("include-html");
        if (file) {
            xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4) {
                    if (this.status == 200) { elmnt.innerHTML = this.responseText; }
                    if (this.status == 404) { elmnt.innerHTML = "Page not found."; }
                    elmnt.removeAttribute("include-html");
                    includeHTML(callback); // ✅ pasa el callback en cada llamada recursiva
                }
            }
            xhttp.open("GET", file, true);
            xhttp.send();
            return;
        }
    }
// ✅ Solo llega aquí cuando ya no quedan más includes pendientes
    if (typeof callback === "function") callback();
};