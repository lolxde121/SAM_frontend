document.addEventListener('DOMContentLoaded', () => {

    const textareaDesc = document.getElementById('desc-mantenimiento');
    const charCounter = document.getElementById('char-count');
    const maxLength = textareaDesc ? textareaDesc.getAttribute('maxlength') : 500;

    function actualizarContador() {
        if (textareaDesc && charCounter) {
            const currentLength = textareaDesc.value.length;
            charCounter.textContent = `${currentLength} / ${maxLength}`;
        }
    }

    if (textareaDesc) {
        textareaDesc.addEventListener('input', actualizarContador);
        actualizarContador();
    }

    // ==========================================
    // 2. OBTENER E INYECTAR DATOS DINÁMICOS
    // ==========================================
    const params = new URLSearchParams(window.location.search);
    const colmenaId = params.get('colmenaId') || '';

    const selectModulo = document.querySelector('select[name="modulo_id"]');
    const dateInput = document.querySelector('input[type="date"]');
    const formMantenimiento = document.getElementById('form-mantenimiento');

    // Por defecto, poner la fecha de hoy
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    function cargarDatosMantenimiento() {
        const url = `/api/mantenimiento?colmenaId=${colmenaId}`;
        fetch(url)
            .then(res => {
                if (!res.ok) throw new Error("Error cargando datos de mantenimiento");
                return res.json();
            })
            .then(data => {
                // Populate Select Dropdown
                if (selectModulo) {
                    selectModulo.innerHTML = '';
                    data.colmenas.forEach(col => {
                        const option = document.createElement('option');
                        option.value = col.id;
                        option.textContent = `${col.codigo} (${col.apiario})`;
                        if (String(col.id) === String(colmenaId)) {
                            option.selected = true;
                        }
                        selectModulo.appendChild(option);
                    });

                    // Si cambian la selección en el dropdown, recargar datos para esa colmena
                    selectModulo.addEventListener('change', () => {
                        window.location.href = `mantenimientoModulo.html?colmenaId=${selectModulo.value}`;
                    });
                }

                // Populate "Datos del módulo" panel
                const modulo = data.modulo;
                const dataList = document.querySelector('.data-list');
                if (dataList) {
                    dataList.innerHTML = `
                        <div class="data-row">
                            <span class="data-label">Identificador</span>
                            <span class="data-value text-white text-bold">${modulo.identificador}</span>
                        </div>
                        <div class="data-row">
                            <span class="data-label">Tipo</span>
                            <span class="data-value text-white">${modulo.tipo}</span>
                        </div>
                        <div class="data-row">
                            <span class="data-label">Estado</span>
                            <span class="status-pill ${modulo.estado === 'activo' ? 'status-activo' : 'status-inactivo'}">${modulo.estado.toUpperCase()}</span>
                        </div>
                        <div class="data-row">
                            <span class="data-label">Instalado</span>
                            <span class="data-value text-white">${modulo.fecha_instalacion}</span>
                        </div>
                        <div class="data-row border-none">
                            <span class="data-label">Eventos registrados</span>
                            <span class="data-value text-white text-bold">${modulo.total_eventos}</span>
                        </div>
                    `;
                }

                // Populate "Historial reciente" timeline
                const timeline = document.querySelector('.timeline');
                if (timeline) {
                    timeline.innerHTML = '';
                    if (data.eventos.length === 0) {
                        timeline.innerHTML = '<p style="color: var(--color-text-gray); font-size: 13px;">No hay mantenimientos registrados aún.</p>';
                    } else {
                        data.eventos.forEach(ev => {
                            const isLimpiezaOrRevision = ev.tipo_evento === 'limpieza' || ev.tipo_evento === 'revision';
                            const dotColor = isLimpiezaOrRevision ? 'dot-teal' : 'dot-yellow';
                            
                            const item = document.createElement('div');
                            item.className = 'timeline-item';
                            item.innerHTML = `
                                <div class="timeline-dot ${dotColor}"></div>
                                <div class="timeline-content">
                                    <div class="timeline-header">
                                        <span class="timeline-title" style="text-transform: capitalize;">${ev.tipo_evento}</span>
                                        <span class="timeline-date">${ev.fecha}</span>
                                    </div>
                                    <p class="timeline-text">${ev.descripcion}</p>
                                </div>
                            `;
                            timeline.appendChild(item);
                        });
                    }
                }
            })
            .catch(err => {
                console.error(err);
            });
    }

    cargarDatosMantenimiento();

    // ==========================================
    // 3. ENVIAR FORMULARIO
    // ==========================================
    if (formMantenimiento) {
        formMantenimiento.addEventListener('submit', (e) => {
            e.preventDefault();

            const selectedColmena = selectModulo ? selectModulo.value : colmenaId;
            const tipoEvento = document.querySelector('input[name="tipo_evento"]:checked').value;
            const fecha = dateInput ? dateInput.value : '';
            const descripcion = textareaDesc ? textareaDesc.value.trim() : '';

            if (!selectedColmena || !tipoEvento || !fecha || !descripcion) {
                alert('Por favor completa todos los campos.');
                return;
            }

            const payload = {
                colmena_id: parseInt(selectedColmena),
                tipo_evento: tipoEvento,
                fecha: fecha,
                descripcion: descripcion
            };

            const submitBtn = formMantenimiento.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Guardando...';
            }

            fetch('/api/mantenimiento', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })
            .then(res => {
                if (!res.ok) throw new Error("Error guardando el mantenimiento");
                return res.json();
            })
            .then(data => {
                alert('Evento de mantenimiento guardado con éxito.');
                // Limpiar descripción
                if (textareaDesc) {
                    textareaDesc.value = '';
                    actualizarContador();
                }
                // Recargar lista
                cargarDatosMantenimiento();
            })
            .catch(err => {
                console.error(err);
                alert('Ocurrió un error al guardar el mantenimiento.');
            })
            .finally(() => {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Guardar evento';
                }
            });
        });
    }

    // Cancelar
    const btnCancelar = document.querySelector('.btn-outline-cancel');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', () => {
            if(confirm('¿Estás seguro de que quieres cancelar y perder los cambios?')) {
                if (textareaDesc) {
                    textareaDesc.value = '';
                    actualizarContador();
                }
            }
        });
    }
});