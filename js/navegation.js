// Función global para cerrar la pantalla de bienvenida con desvanecimiento
function cerrarSplash() {
    var splash = document.getElementById('splash-screen');
    if (splash && !splash.classList.contains('hidden')) {
        splash.classList.add('hidden');
        sessionStorage.setItem('splashVisto', 'true'); // ← guarda que fue visto
        
        // Lo removemos del DOM por completo después de que termine la animación
        setTimeout(function() {
            splash.remove();
        }, 400);
    }
}

// Oculta el splash si el usuario ya lo vio en esta visita
if (sessionStorage.getItem('splashVisto')) {
    var splash = document.getElementById('splash-screen');
    if (splash) splash.remove();
}

// Eventos de inicialización inmediata
document.addEventListener('DOMContentLoaded', function() {
    // 1. Desaparecer automáticamente tras 2 segundos (2000 milisegundos)
    setTimeout(cerrarSplash, 2000);

    // 2. Desaparecer inmediatamente si el usuario presiona la tecla 'Escape' (Esc)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
            cerrarSplash();
        }
    });
});

// Constante global para evitar duplicar el teléfono en el código
const WHATSAPP_CONFIG = {
    telefono: "51954301376",
    simboloMoneda: "S/"
};

// Ordena productos según criterio (Compatible con Búsqueda Global)
function ordenarProductos(contenedorId, criterio, paginacionId) {
    var contenedor = document.getElementById(contenedorId);
    if (!contenedor) return;
    
    var productos = Array.from(contenedor.querySelectorAll('.product-box'));

    productos.sort(function(a, b) {
        if (criterio === 'precio-bajo') {
            return parseFloat(a.dataset.price) - parseFloat(b.dataset.price);
        }
        if (criterio === 'precio-alto') {
            return parseFloat(b.dataset.price) - parseFloat(a.dataset.price);
        }
        if (criterio === 'descuento') {
            var ofertaA = a.querySelector('.offer:not(.hidden)') ? 0 : 1;
            var ofertaB = b.querySelector('.offer:not(.hidden)') ? 0 : 1;
            return ofertaA - ofertaB;
        }
        if (criterio === 'opiniones') {
            return parseFloat(b.dataset.rating) - parseFloat(a.dataset.rating);
        }
        return 0;
    });

    // Reorganizamos los elementos en el DOM con el nuevo orden
    productos.forEach(function(p) {
        contenedor.appendChild(p);
    }); 

    // ⚡ SOLUCIÓN AL BUG: Detectar si hay una búsqueda global activa
    var searchInput = document.querySelector('.search-input.global');
    var termino = searchInput ? searchInput.value.trim() : '';

    if (termino !== '') {
        // Si hay texto en el buscador, re-filtramos la búsqueda sobre el nuevo orden
        // manteniendo la paginación oculta para que no rompa los resultados
        buscarGlobal(termino);
    } else {
        // Si el buscador está vacío, la paginación normal vuelve a actuar con normalidad
        if (paginacionId) {
            iniciarPaginacion(contenedorId, paginacionId, 6);
        }
    }
}

// Paginación simple
function iniciarPaginacion(contenedorId, paginacionId, productosPorPagina) {
    var contenedor = document.getElementById(contenedorId);
    var paginacion = document.getElementById(paginacionId);
    if (!contenedor || !paginacion) return;

    var productos = Array.from(contenedor.querySelectorAll('.product-box'));
    var totalPaginas = Math.ceil(productos.length / productosPorPagina);
    var paginaActual = 1;

    function mostrarPagina(pagina) {
        paginaActual = pagina;
        var inicio = (pagina - 1) * productosPorPagina;
        var fin = inicio + productosPorPagina;

        productos.forEach(function(p, index) {
            p.style.display = (index >= inicio && index < fin) ? '' : 'none';
        });

        var links = paginacion.querySelectorAll('a');
        links.forEach(function(link) {
            link.classList.remove('active');
            if (parseInt(link.dataset.pagina) === pagina) {
                link.classList.add('active');
            }
        });
    }

    function renderPaginacion() {
        paginacion.innerHTML = '';
        for (var i = 1; i <= totalPaginas; i++) {
            var li = document.createElement('li');
            var a = document.createElement('a');
            a.href = '#';
            a.textContent = i;
            a.dataset.pagina = i;
            a.addEventListener('click', (function(num) {
                return function(e) {
                    e.preventDefault();
                    mostrarPagina(num);
                };
            })(i));
            li.appendChild(a);
            paginacion.appendChild(li);
        }
        mostrarPagina(1);
    }

    renderPaginacion();
}

// Modal de reclamos
function abrirReclamo() {
    document.getElementById('modal-reclamo').style.display = 'block';
}

function cerrarReclamo() {
    document.getElementById('modal-reclamo').style.display = 'none';
    document.getElementById('form-reclamo').reset();
    var msg = document.getElementById('reclamo-mensaje');
    if (msg) msg.style.display = 'none'; // ← solo si existe
}

window.addEventListener('click', function(e) {
    var modal = document.getElementById('modal-reclamo');
    if (e.target === modal) cerrarReclamo();
});

function cerrarPopupCodigo() {
    document.getElementById('popup-codigo').style.display = 'none';
    cerrarReclamo();
}

function copiarCodigoReclamo() {
    var codigo = document.getElementById('codigo-generado').textContent;
    navigator.clipboard.writeText(codigo).then(function() {
        var msg = document.getElementById('msg-copiado');
        msg.style.display = 'block';
        setTimeout(function() { msg.style.display = 'none'; }, 3000);
    });
}

// Maneja el envío del formulario de reclamos
document.addEventListener('submit', function(e) {
    if (e.target.id === 'form-reclamo') {
        e.preventDefault();
        var form = e.target;

        var codigoUnico = generarCodigoReclamo();
        var inputCodigo = document.createElement('input');
        inputCodigo.type = 'hidden';
        inputCodigo.name = 'codigo_seguimiento';
        inputCodigo.value = codigoUnico;
        form.appendChild(inputCodigo);

        fetch(form.action, {
            method: 'POST',
            body: new FormData(form),
            headers: { 'Accept': 'application/json' }
        }).then(function(response) {
            if (response.ok) {
                // ✅ Corrección Bug 2: Se usa la misma variable 'codigoUnico' enviada al servidor
                document.getElementById('codigo-generado').textContent = codigoUnico;
                document.getElementById('popup-codigo').style.display = 'flex';
            } else {
                alert('Hubo un error al enviar. Intenta de nuevo.');
            }
        }).catch(function() {
            alert('Error de red. Verifica tu conexión e intenta de nuevo.');
        });
    }
});

function generarCodigoReclamo() {
    var ahora = new Date();
    var year  = ahora.getFullYear();
    var mes   = String(ahora.getMonth() + 1).padStart(2, '0');
    var dia   = String(ahora.getDate()).padStart(2, '0');
    var hora  = String(ahora.getHours()).padStart(2, '0');
    var min   = String(ahora.getMinutes()).padStart(2, '0');
    var seg   = String(ahora.getSeconds()).padStart(2, '0');

    return 'RC-' + year + mes + dia + '-' + hora + min + seg;
}

// Función de búsqueda global
function buscarGlobal(termino) {
    var texto = termino.trim().toLowerCase();
    var secciones = ['tortas', 'bocaditos', 'minisandwiches', 'tematicas', 'bowls', 'postres', 'diamadre', 'navidad'];
    var nombresSeccion = {
        tortas:         'Tortas',
        bocaditos:      'Bocaditos',
        minisandwiches: 'Mini Sándwiches',
        tematicas:      'Tortas Temáticas',
        bowls:          'Bowls',
        postres:        'Postres en Porciones',
        diamadre:       'Día de la Madre',
        navidad:        'Navidad'
    };

    var contador = document.getElementById('contador-resultados');
    if (!contador) {
        contador = document.createElement('div');
        contador.id = 'contador-resultados';
        contador.style.cssText = 'display:none; padding:10px 0; font-size:14px; color:#888;';
        var span = document.createElement('span');
        span.id = 'contador-numero';
        contador.appendChild(span);
        var primeraSeccion = document.getElementById('seccion-tortas');
        if (primeraSeccion) {
            primeraSeccion.parentNode.insertBefore(contador, primeraSeccion);
        }
    }

    var contadorNumero = document.getElementById('contador-numero');

    if (texto === '') {
        if (contador) contador.style.display = 'none';

        secciones.forEach(function(s) {
            var sep = document.getElementById('separador-' + s);
            if (sep) sep.remove();
        });

        secciones.forEach(function(s) {
            var seccion = document.getElementById('seccion-' + s);
            if (seccion) seccion.style.display = 'none';

            var msg = document.getElementById('sin-resultados-' + s);
            if (msg) msg.remove();

            var productos = document.querySelectorAll('#productos-' + s + ' .product-box');
            productos.forEach(function(p) { p.style.display = ''; });

            var paginacion = document.getElementById('paginacion-' + s);
            if (paginacion) paginacion.style.display = '';
        });

        iniciarPaginacion('productos-tortas',         'paginacion-tortas',         6);
        iniciarPaginacion('productos-bocaditos',      'paginacion-bocaditos',      6);
        iniciarPaginacion('productos-bowls',          'paginacion-bowls',          6);
        iniciarPaginacion('productos-minisandwiches', 'paginacion-minisandwiches', 6);
        iniciarPaginacion('productos-tematicas',      'paginacion-tematicas',      6);
        iniciarPaginacion('productos-postres',        'paginacion-postres',        6);
        iniciarPaginacion('productos-diamadre',       'paginacion-diamadre',       6);
        iniciarPaginacion('productos-navidad',        'paginacion-navidad',        6);

        var activa = document.querySelector('.menu-item.active');
        if (activa) mostrarSeccion(activa.dataset.seccion);
        return;
    }

    secciones.forEach(function(s) {
        var seccion = document.getElementById('seccion-' + s);
        if (!seccion) return;

        seccion.style.display = 'block';

        var paginacion = document.getElementById('paginacion-' + s);
        if (paginacion) paginacion.style.display = 'none';

        var sepAnterior = document.getElementById('separador-' + s);
        if (sepAnterior) sepAnterior.remove();

        var productos = Array.from(document.querySelectorAll('#productos-' + s + ' .product-box'));

        var coincidentes = productos.filter(function(p) {
            var nombre = p.querySelector('h3') ? p.querySelector('h3').textContent.toLowerCase() : '';
            return nombre.includes(texto);
        });

        productos.forEach(function(p) { p.style.display = 'none'; });
        coincidentes.forEach(function(p) { p.style.display = ''; });

        var msgId = 'sin-resultados-' + s;
        var msgExistente = document.getElementById(msgId);

        if (coincidentes.length === 0) {
            seccion.style.display = 'none';
            if (msgExistente) msgExistente.remove();
        } else {
            if (msgExistente) msgExistente.remove();

            var separador = document.createElement('div');
            separador.id = 'separador-' + s;
            separador.className = 'separador-seccion';
            separador.textContent = nombresSeccion[s] + ' (' + coincidentes.length + ')';

            var contenedorProductos = document.getElementById('productos-' + s);
            contenedorProductos.parentNode.insertBefore(separador, contenedorProductos);
        }
    });

    var totalEncontrados = secciones.reduce(function(total, s) {
        var visibles = document.querySelectorAll('#productos-' + s + ' .product-box:not([style*="display: none"])');
        return total + visibles.length;
    }, 0);

    if (contador && contadorNumero) {
        if (totalEncontrados > 0) {
            contadorNumero.textContent = totalEncontrados + ' producto' + (totalEncontrados !== 1 ? 's' : '') + ' encontrado' + (totalEncontrados !== 1 ? 's' : '') + ' para "' + termino + '"';
            contador.style.display = 'block';
        } else {
            contador.style.display = 'none';
        }
    }

    var hayResultados = secciones.some(function(s) {
        var seccion = document.getElementById('seccion-' + s);
        return seccion && seccion.style.display !== 'none';
    });

    var msgGeneral = document.getElementById('sin-resultados-global');
    if (!hayResultados) {
        if (!msgGeneral) {
            var msg = document.createElement('p');
            msg.id = 'sin-resultados-global';
            msg.style.cssText = 'text-align:center; color:#888; padding:40px; width:100%; font-size:16px;';
            msg.textContent = 'No se encontraron productos para "' + termino + '"';
            var primeraSeccion = document.getElementById('seccion-tortas');
            if (primeraSeccion) {
                primeraSeccion.parentNode.insertBefore(msg, primeraSeccion);
            }
        }
    } else {
        if (msgGeneral) msgGeneral.remove();
    }
}

// Variables para el slider del modal de producto
var sliderFotoActual = 0;
var sliderFotos = [];

function abrirModalProducto(el) {
    var nombre      = el.dataset.nombre      || el.querySelector('h3').textContent;
    var descripcion = el.dataset.descripcion || '';
    var precio      = el.dataset.price       || '';
    var fotos       = el.dataset.fotos ? el.dataset.fotos.split(',') : [el.querySelector('img').src];
    var precioHTML  = el.querySelector('.price').innerHTML;

// Guardamos el precio crudo en el modal para el carrito de compras seguro
    var modalElement = document.getElementById('modal-producto');
    modalElement.dataset.rawPrice = precio;

    document.getElementById('modal-producto-nombre').textContent = nombre;
    var lineas = descripcion.split('\n').map(function(l) { return l.trim(); }).filter(Boolean); // Convierte la descripción en lista HTML: líneas con '-' → <li>, resto → <p>
    var html = lineas.map(function(l) {
        return l.startsWith('-') ? '<li>' + l.substring(1).trim() + '</li>' : '<p>' + l + '</p>';
    }).join('');
    var tieneItems = lineas.some(function(l) { return l.startsWith('-'); });
    document.getElementById('modal-producto-descripcion').innerHTML = tieneItems 
        ? '<ul style="padding-left:18px; margin:8px 0;">' + html + '</ul>'
        : html;
    document.getElementById('modal-producto-precio').innerHTML = precioHTML;

    sliderFotos = fotos;
    sliderFotoActual = 0;
    var contenedor = document.getElementById('slider-fotos');
    contenedor.innerHTML = '';
    fotos.forEach(function(src) {
        var img = document.createElement('img');
        img.src = src.trim();
        img.alt = nombre;
        contenedor.appendChild(img);
    });
    actualizarSlider();

    var puntos = document.getElementById('slider-puntos');
    puntos.innerHTML = '';
    fotos.forEach(function(_, i) {
        var punto = document.createElement('span');
        punto.classList.add('slider-punto');
        if (i === 0) punto.classList.add('activo');
        punto.addEventListener('click', function() { irAFoto(i); });
        puntos.appendChild(punto);
    });

    var flechas = document.querySelectorAll('.slider-flecha');
    flechas.forEach(function(f) {
        f.style.display = fotos.length > 1 ? '' : 'none';
    });
    puntos.style.display = fotos.length > 1 ? '' : 'none';

    var mensaje = 'Hola, me gustaría pedir: ' + nombre + ' (' + WHATSAPP_CONFIG.simboloMoneda + precio + ')';
    document.getElementById('modal-btn-whatsapp').href =
        'https://wa.me/' + WHATSAPP_CONFIG.telefono + '?text=' + encodeURIComponent(mensaje);

    modalElement.style.display = 'block';
}

function cerrarModalProducto() {
    document.getElementById('modal-producto').style.display = 'none';
}

function actualizarSlider() {
    var contenedor = document.getElementById('slider-fotos');
    var imgs = contenedor.querySelectorAll('img');
    imgs.forEach(function(img, i) {
        img.style.transform = 'translateX(' + (-sliderFotoActual * 100) + '%)';
    });

    var puntos = document.querySelectorAll('.slider-punto');
    puntos.forEach(function(p, i) {
        p.classList.toggle('activo', i === sliderFotoActual);
    });
}

function cambiarFoto(direccion) {
    sliderFotoActual = (sliderFotoActual + direccion + sliderFotos.length) % sliderFotos.length;
    actualizarSlider();
}

function irAFoto(index) {
    sliderFotoActual = index;
    actualizarSlider();
}

window.addEventListener('click', function(e) {
    var modal = document.getElementById('modal-producto');
    if (e.target === modal) cerrarModalProducto();
});

// Carrito de compras
var carrito = JSON.parse(localStorage.getItem('carrito')) || [];

function guardarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
}

function abrirCarrito() {
    document.getElementById('panel-carrito').style.display = 'flex';
    document.getElementById('carrito-overlay').style.display = 'block';
}

function cerrarCarrito() {
    document.getElementById('panel-carrito').style.display = 'none';
    document.getElementById('carrito-overlay').style.display = 'none';
}

// ✅ Corrección Bug 4 y 5: Única declaración limpia y lectura de precio decimal segura
function agregarAlCarrito() {
    var nombre = document.getElementById('modal-producto-nombre').textContent;
    // Leemos el precio desde el dataset guardado en abrirModalProducto para evitar errores de parseo con decimales
    var precio = parseFloat(document.getElementById('modal-producto').dataset.rawPrice) || 0;

    var existente = carrito.find(function(p) { return p.nombre === nombre; });
    if (existente) {
        existente.cantidad++;
    } else {
        carrito.push({ nombre: nombre, precio: precio, cantidad: 1 });
    }

    guardarCarrito();
    renderCarrito();
    cerrarModalProducto();
    abrirCarrito();
}

function renderCarrito() {
    var lista = document.getElementById('carrito-lista');
    var total = 0;

    lista.innerHTML = '';

    if (carrito.length === 0) {
        lista.innerHTML = '<p style="color:#aaa; text-align:center; margin-top:40px;">Tu carrito está vacío</p>';
        document.getElementById('carrito-total').textContent = WHATSAPP_CONFIG.simboloMoneda + '0';
        var contador = document.getElementById('carrito-contador');
        if (contador) contador.textContent = '0 artículos en el carrito';
        document.getElementById('carrito-btn-whatsapp').href = '#';
        return;
    }

    carrito.forEach(function(producto, index) {
        var subtotal = producto.precio * producto.cantidad;
        total += subtotal;

        var item = document.createElement('div');
        item.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid #f0f0f0; gap:8px;';
        item.innerHTML = `
            <div style="flex:1;">
                <p style="margin:0 0 4px; font-size:14px;">${producto.nombre}</p>
                <p style="margin:0; font-size:13px; color:#888;">${WHATSAPP_CONFIG.simboloMoneda}${producto.precio} c/u</p>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <button onclick="cambiarCantidad(${index}, -1)" style="width:26px; height:26px; border:1px solid #ddd; border-radius:4px; background:none; cursor:pointer; font-size:16px;">−</button>
                <span style="min-width:20px; text-align:center;">${producto.cantidad}</span>
                <button onclick="cambiarCantidad(${index}, 1)" style="width:26px; height:26px; border:1px solid #ddd; border-radius:4px; background:none; cursor:pointer; font-size:16px;">+</button>
            </div>
            <div style="text-align:right; min-width:60px;">
                <p style="margin:0; font-size:14px; font-weight:bold;">${WHATSAPP_CONFIG.simboloMoneda}${subtotal}</p>
                <button onclick="eliminarDelCarrito(${index})" style="background:none; border:none; color:#ccc; cursor:pointer; font-size:12px; padding:0;">✕ quitar</button>
            </div>
        `;
        lista.appendChild(item);
    });

    document.getElementById('carrito-total').textContent = WHATSAPP_CONFIG.simboloMoneda + total;

    var totalItems = carrito.reduce(function(sum, p) { return sum + p.cantidad; }, 0);
    document.getElementById('carrito-contador').textContent = totalItems + ' artículo' + (totalItems !== 1 ? 's' : '') + ' en el carrito';

    var mensaje = 'Hola, me gustaría hacer el siguiente pedido:\n\n';
    carrito.forEach(function(p) {
        mensaje += '• ' + p.nombre + ' x' + p.cantidad + ' — ' + WHATSAPP_CONFIG.simboloMoneda + (p.precio * p.cantidad) + '\n';
    });
    mensaje += '\nTotal: ' + WHATSAPP_CONFIG.simboloMoneda + total;
    document.getElementById('carrito-btn-whatsapp').href = 'https://wa.me/' + WHATSAPP_CONFIG.telefono + '?text=' + encodeURIComponent(mensaje);
}

function cambiarCantidad(index, delta) {
    carrito[index].cantidad += delta;
    if (carrito[index].cantidad <= 0) {
        carrito.splice(index, 1);
    }
    guardarCarrito();
    renderCarrito();
}

function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    guardarCarrito();
    renderCarrito();
}

function vaciarCarrito() {
    carrito = [];
    guardarCarrito();
    renderCarrito();
}

// Favoritos
var favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];

function guardarFavoritos() {
    localStorage.setItem('favoritos', JSON.stringify(favoritos));
}

function toggleFavorito(el) {
    var nombre = el.dataset.nombre || el.querySelector('h3').textContent;
    var precio = el.dataset.price;
    var foto   = el.querySelector('img').src;
    var fotos  = el.dataset.fotos || foto;

    var index = favoritos.findIndex(function(f) { return f.nombre === nombre; });

    if (index === -1) {
        favoritos.push({ nombre: nombre, precio: precio, foto: foto, fotos: fotos });
        mostrarToast('❤️ Agregado a favoritos');
    } else {
        favoritos.splice(index, 1);
        mostrarToast('🤍 Eliminado de favoritos');
    }

    guardarFavoritos();
    actualizarBotonesFavorito();
    actualizarContadorFavoritos();
}

function esFavorito(nombre) {
    return favoritos.some(function(f) { return f.nombre === nombre; });
}

function actualizarBotonesFavorito() {
    document.querySelectorAll('.product-box').forEach(function(box) {
        var nombre = box.dataset.nombre || (box.querySelector('h3') ? box.querySelector('h3').textContent : '');
        var btn = box.querySelector('.btn-favorito');
        if (btn) {
            var esFav = esFavorito(nombre);
            btn.textContent = esFav ? '❤️' : '🤍';
            btn.title = esFav ? 'Quitar de favoritos' : 'Agregar a favoritos';
            btn.classList.toggle('es-favorito', esFav);
        }
    });
}

function actualizarContadorFavoritos() {
    var contador = document.getElementById('favoritos-contador');
    if (contador) {
        contador.textContent = favoritos.length > 0
            ? favoritos.length + ' favorito' + (favoritos.length !== 1 ? 's' : '')
            : 'Mis favoritos';
    }
}

function mostrarToast(mensaje) {
    var toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.cssText = 'position:fixed; bottom:80px; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.75); color:white; padding:10px 20px; border-radius:20px; font-size:14px; z-index:2000; transition:opacity 0.3s;';
        document.body.appendChild(toast);
    }
    toast.textContent = mensaje;
    toast.style.opacity = '1';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function() { toast.style.opacity = '0'; }, 2000);
}

function abrirFavoritos() {
    renderFavoritos();
    document.getElementById('panel-favoritos').style.display = 'flex';
    document.getElementById('favoritos-overlay').style.display = 'block';
}

function cerrarFavoritos() {
    document.getElementById('panel-favoritos').style.display = 'none';
    document.getElementById('favoritos-overlay').style.display = 'none';
}

function renderFavoritos() {
    var lista = document.getElementById('favoritos-lista');
    lista.innerHTML = '';

    if (favoritos.length === 0) {
        lista.innerHTML = '<p style="color:#aaa; text-align:center; margin-top:40px;">No tienes favoritos aún</p>';
        return;
    }

    favoritos.forEach(function(producto, index) {
        var item = document.createElement('div');
        item.style.cssText = 'display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid #f0f0f0;';
        item.innerHTML = `
            <img src="${producto.foto}" style="width:60px; height:60px; object-fit:cover; border-radius:6px;"/>
            <div style="flex:1;">
                <p style="margin:0 0 4px; font-size:14px;">${producto.nombre}</p>
                <p style="margin:0; font-size:13px; color:#888;">${WHATSAPP_CONFIG.simboloMoneda}${producto.precio}</p>
            </div>
            <div style="display:flex; flex-direction:column; gap:6px;">
                <button onclick="agregarFavoritoAlCarrito(${index})" style="padding:6px 10px; background:var(--color-primary-dark); color:white; border:none; border-radius:4px; font-size:12px; cursor:pointer;">+ Carrito</button>
                <button onclick="quitarFavorito(${index})" style="padding:6px 10px; background:none; border:1px solid #ddd; border-radius:4px; font-size:12px; color:#888; cursor:pointer;">✕ Quitar</button>
            </div>
        `;
        lista.appendChild(item);
    });
}

function quitarFavorito(index) {
    favoritos.splice(index, 1);
    guardarFavoritos();
    actualizarBotonesFavorito();
    actualizarContadorFavoritos();
    renderFavoritos();
}

function agregarFavoritoAlCarrito(index) {
    var producto = favoritos[index];
    var existente = carrito.find(function(p) { return p.nombre === producto.nombre; });
    if (existente) {
        existente.cantidad++;
    } else {
        carrito.push({ nombre: producto.nombre, precio: parseFloat(producto.precio) || 0, cantidad: 1 });
    }
    renderCarrito();
    cerrarFavoritos();
    abrirCarrito();
}

// Animación de productos al hacer scroll
function iniciarAnimacionProductos() {
    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry, index) {
            if (entry.isIntersecting) {
                var el = entry.target;
                var delay = (index % 3) * 100;
                setTimeout(function() {
                    el.classList.add('visible');
                }, delay);
                observer.unobserve(el);
            }
        });
    }, {
        threshold: 0.1
    });

    document.querySelectorAll('.product-box').forEach(function(box) {
        observer.observe(box);
    });
}

function mostrarSeccion(seccion) {
    var nombres = {
        tortas:         'Tortas',
        bocaditos:      'Bocaditos',
        minisandwiches: 'Mini Sándwiches',
        tematicas:      'Tortas Temáticas',
        bowls:          'Bowls',
        postres:        'Paquetes y Promociones',
        diamadre:       'Día de la Madre',
        navidad:        'Navidad'
    };
    document.title = (nombres[seccion] || seccion) + ' | Dulce Mordida';

    var secciones = ['tortas', 'bocaditos', 'minisandwiches', 'tematicas', 'bowls', 'postres', 'diamadre', 'navidad'];

    secciones.forEach(function(s) {
        var el = document.getElementById('seccion-' + s);
        if (el) el.style.display = 'none';
    });

    var activa = document.getElementById('seccion-' + seccion);
    if (activa) activa.style.display = 'block';

    document.querySelectorAll('.menu-item').forEach(function(item) {
        item.classList.remove('active');
    });
    var menuActivo = document.querySelector('[data-seccion="' + seccion + '"]');
    if (menuActivo) menuActivo.classList.add('active');

    document.querySelectorAll('#seccion-' + seccion + ' .product-box').forEach(function(box) {
        box.classList.remove('visible');
        setTimeout(function() {
            box.classList.add('visible');
        }, 50);
    });
}

// ✅ ÚNICA INICIALIZACIÓN GLOBAL CUANDO EL DOM ESTÁ TOTALMENTE RENDERIZADO
includeHTML(function() {
    mostrarSeccion('tortas');
    iniciarPaginacion('productos-tortas',         'paginacion-tortas',         6);
    iniciarPaginacion('productos-bocaditos',      'paginacion-bocaditos',      6);
    iniciarPaginacion('productos-bowls',          'paginacion-bowls',          6);
    iniciarPaginacion('productos-minisandwiches', 'paginacion-minisandwiches', 6);
    iniciarPaginacion('productos-tematicas',      'paginacion-tematicas',      6);
    iniciarPaginacion('productos-postres',        'paginacion-postres',        6);
    iniciarPaginacion('productos-diamadre',       'paginacion-diamadre',       6);
    iniciarPaginacion('productos-navidad',        'paginacion-navidad',        6);
    
    actualizarBotonesFavorito();
    actualizarContadorFavoritos();
    renderCarrito();
    iniciarAnimacionProductos();

// Renderiza el rating debajo del nombre de cada producto
// El valor viene de data-rating en cada .product-box de products.html
// Formato: "★ 4.8" — tipografía Newsreader itálica, color gris suave
// Para actualizar un puntaje: editar data-rating en products.html
    document.querySelectorAll('.product-box').forEach(function(box) {
        var rating = parseFloat(box.dataset.rating);
        if (!rating) return;
        var div = document.createElement('div');
        div.className = 'product-rating';
        div.textContent = '★ ' + rating.toFixed(1);
        var h3 = box.querySelector('h3');
        if (h3) h3.insertAdjacentElement('afterend', div);
    });

// Drag del botón WhatsApp flotante e Inyección de Globo
    var btn = document.querySelector('.whatsapp-flotante');
    if (!btn) return;

    // 1. Creamos el elemento del globo de texto (se reutiliza la variable 'btn')
    var bubble = document.createElement('div');
    bubble.className = 'wa-notification-bubble';
    bubble.innerHTML = '¿Tienes dudas? ¡Escríbenos! 🍰';
    document.body.appendChild(bubble);

    // 2. Esperamos 4 segundos (4000ms) para mostrarlo elegantemente
    setTimeout(function() {
        bubble.classList.add('show');
    }, 4000);

    // Ocultar globo si hacen clic directo para chatear
    btn.addEventListener('click', function() {
        bubble.classList.remove('show');
    });

    // LÓGICA DE ARRASTRE (DRAG)
    var arrastrando = false;
    var seMovio = false;
    var offsetX = 0;
    var offsetY = 0;

    btn.addEventListener('mousedown', function(e) {
        arrastrando = true;
        seMovio = false;
        bubble.classList.remove('show'); // 👈 Si lo empiezan a mover en PC, ocultamos el globo
        offsetX = e.clientX - btn.getBoundingClientRect().left;
        offsetY = e.clientY - btn.getBoundingClientRect().top;
        btn.classList.add('arrastrando');
        e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
        if (!arrastrando) return;
        seMovio = true;

        var x = e.clientX - offsetX;
        var y = e.clientY - offsetY;

        x = Math.max(0, Math.min(window.innerWidth  - btn.offsetWidth,  x));
        y = Math.max(0, Math.min(window.innerHeight - btn.offsetHeight, y));

        btn.style.left   = x + 'px';
        btn.style.top    = y + 'px';
        btn.style.right  = 'auto';
        btn.style.bottom = 'auto';
    });

    document.addEventListener('mouseup', function() {
        if (!arrastrando) return;
        arrastrando = false;
        btn.classList.remove('arrastrando');

        if (seMovio) {
            btn.addEventListener('click', function cancelar(e) {
                e.preventDefault();
                btn.removeEventListener('click', cancelar);
            }, { once: true });
        }
    });

// LÓGICA TÁCTIL (CELULARES)
    btn.addEventListener('touchstart', function(e) {
        var touch = e.touches[0];
        arrastrando = true;
        seMovio = false;
        bubble.classList.remove('show'); // 👈 Si lo empiezan a mover en celular, ocultamos el globo
        offsetX = touch.clientX - btn.getBoundingClientRect().left;
        offsetY = touch.clientY - btn.getBoundingClientRect().top;
        btn.classList.add('arrastrando');
        e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchmove', function(e) {
        if (!arrastrando) return;
        seMovio = true;
        var touch = e.touches[0];

        var x = touch.clientX - offsetX;
        var y = touch.clientY - offsetY;

        x = Math.max(0, Math.min(window.innerWidth  - btn.offsetWidth,  x));
        y = Math.max(0, Math.min(window.innerHeight - btn.offsetHeight, y));

        btn.style.left   = x + 'px';
        btn.style.top    = y + 'px';
        btn.style.right  = 'auto';
        btn.style.bottom = 'auto';
    }, { passive: false });

    document.addEventListener('touchend', function() {
        if (!arrastrando) return;
        arrastrando = false;
        btn.classList.remove('arrastrando');

        // Tap simple (sin movimiento) → abre WhatsApp directamente
        if (!seMovio) {
            window.open(btn.href, '_blank'); // ← tap simple → abre WhatsApp
        }

        // Si hubo movimiento → cancela el clic para evitar abrir WhatsApp al soltar
        if (seMovio) {
            btn.addEventListener('click', function cancelar(e) {
                e.preventDefault();
                btn.removeEventListener('click', cancelar);
            }, { once: true });
        }
    });
});

// ⚡ LÓGICA DEL ACORDEÓN DE PREGUNTAS FRECUENTES (FAQ)
document.addEventListener('click', function(e) {
    // Buscamos si el clic fue en un botón de pregunta o dentro de él
    var botonPregunta = e.target.closest('.faq-pregunta');
    if (!botonPregunta) return;

    var itemActual = botonPregunta.closest('.faq-item');
    if (!itemActual) return;

    // Opcional: Cerrar las otras preguntas abiertas para mantener el orden (Efecto Acordeón Único)
    var todosLosItems = document.querySelectorAll('.faq-item');
    todosLosItems.forEach(function(item) {
        if (item !== itemActual) {
            item.classList.remove('active');
        }
    });

    // Alternar la clase active en la pregunta clickeada
    itemActual.classList.toggle('active');
});