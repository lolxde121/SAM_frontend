// ============================================================================
// SAM - MOCK FETCH SERVICE (INTERCEPTOR PARA VERCEL)
// Intercepta todas las llamadas fetch y las simula localmente usando localStorage.
// ============================================================================

(function() {
    // 1. INICIALIZAR LOCAL STORAGE CON DATOS MOCK SI NO EXISTEN
    function initLocalStorage() {
        if (!localStorage.getItem('usuarios')) {
            localStorage.setItem('usuarios', JSON.stringify([
                {id: 1, nombre: "Emmanuel Domínguez", email: "admin@sam.com", rol: "admin", activo: true},
                {id: 2, nombre: "Rodrigo Gómez", email: "rodrigo@sam.com", rol: "apicultor", activo: true},
                {id: 3, nombre: "Edgar Beekeep", email: "edgar@sam.com", rol: "apicultor", activo: true}
            ]));
        }
        if (!localStorage.getItem('apiarios')) {
            localStorage.setItem('apiarios', JSON.stringify([
                {id: 1, nombre: "Apiario Colima", estado: "Activo", municipio: "Colima", localidad: "Rancho Grande", colmenas: 3, microclima: "Templado", microclima_id: 1},
                {id: 2, nombre: "Apiario Tecomán", estado: "Activo", municipio: "Tecomán", localidad: "La Huerta", colmenas: 2, microclima: "Cálido", microclima_id: 2}
            ]));
        }
        if (!localStorage.getItem('colmenas')) {
            localStorage.setItem('colmenas', JSON.stringify([
                {db_id: 1, id: "C-01", apiario: "Apiario Colima", apiario_id: 1, monitoreo: "ESP-101", ecotipo: "Apis mellifera", estado: "verde", estadoTexto: "Saludable"},
                {db_id: 2, id: "C-02", apiario: "Apiario Colima", apiario_id: 1, monitoreo: "Sin asignar", ecotipo: "Apis mellifera", estado: "verde", estadoTexto: "Saludable"},
                {db_id: 3, id: "C-03", apiario: "Apiario Tecomán", apiario_id: 2, monitoreo: "ESP-102", ecotipo: "Apis mellifera", estado: "rojo", estadoTexto: "Atención Requerida"}
            ]));
        }
        if (!localStorage.getItem('alertas')) {
            localStorage.setItem('alertas', JSON.stringify([
                {id: 1, colmena: "C-03", mensaje: "Temperatura interna elevada (38.5°C)", nivel: "critica", tiempo: "Hace 10 min", atendida: false},
                {id: 2, colmena: "C-01", mensaje: "Batería baja en sensor", nivel: "aviso", tiempo: "Hace 2 horas", atendida: false}
            ]));
        }
        if (!localStorage.getItem('visitas')) {
            localStorage.setItem('visitas', JSON.stringify([
                {fecha: "2026-07-15", colmena: "C-01", apicultor: "Edgar Beekeep", estado_colonia: "Excelente", reina: "Vista", notas: "Control de rutina. Colmena fuerte."},
                {fecha: "2026-07-14", colmena: "C-02", apicultor: "Rodrigo Gómez", estado_colonia: "Regular", reina: "No vista", notas: "Revisar alimentación la próxima semana."}
            ]));
        }
        if (!localStorage.getItem('cosechas')) {
            localStorage.setItem('cosechas', JSON.stringify([
                {id: 1, fecha: "2026-07-15", colmena: "C-01", apiario: "Apiario Colima", apicultor: "Edgar Beekeep", kg: 25.4, calidad: "Excelente (Multifloral)"},
                {id: 2, fecha: "2026-07-12", colmena: "C-02", apiario: "Apiario Colima", apicultor: "Rodrigo Gómez", kg: 18.2, calidad: "Buena (Acuosa)"}
            ]));
        }
        if (!localStorage.getItem('usuarioLogueado')) {
            // Por defecto iniciamos con Edgar en modo demo
            localStorage.setItem('usuarioLogueado', 'edgar@sam.com');
            localStorage.setItem('rolUsuario', 'apicultor');
            localStorage.setItem('usuarioLogueadoNombre', 'Edgar Beekeep');
        }
    }

    initLocalStorage();

    // 2. INTERCEPTOR DE FETCH
    const originalFetch = window.fetch;

    window.fetch = function(input, init) {
        let url = typeof input === 'string' ? input : input.url;
        let method = (init && init.method) ? init.method.toUpperCase() : 'GET';
        let body = (init && init.body) ? JSON.parse(init.body) : null;

        // Parsear URL relativa o absoluta
        const urlObj = new URL(url, window.location.origin);
        const path = urlObj.pathname;
        const searchParams = urlObj.searchParams;

        console.log(`[MOCK FETCH Interceptor] ${method} ${path}`, body);

        // Helper para simular respuesta JSON exitosa
        function jsonResponse(data, status = 200) {
            return Promise.resolve(new Response(JSON.stringify(data), {
                status: status,
                headers: { 'Content-Type': 'application/json' }
            }));
        }

        // --- RUTA: /api/auth/login ---
        if (path === '/api/auth/login' && method === 'POST') {
            const username = body.username;
            const password = body.password;

            let users = JSON.parse(localStorage.getItem('usuarios'));
            let matchedUser = users.find(u => u.email === username);

            if (matchedUser) {
                localStorage.setItem('usuarioLogueado', matchedUser.email);
                localStorage.setItem('rolUsuario', matchedUser.rol);
                localStorage.setItem('usuarioLogueadoNombre', matchedUser.nombre);
                return jsonResponse({ mensaje: "Login exitoso", rol: matchedUser.rol });
            } else {
                // Si no existe, creamos uno al vuelo para la demo
                const name = username.split('@')[0].toUpperCase();
                localStorage.setItem('usuarioLogueado', username);
                localStorage.setItem('rolUsuario', 'apicultor');
                localStorage.setItem('usuarioLogueadoNombre', name);
                return jsonResponse({ mensaje: "Login exitoso", rol: "apicultor" });
            }
        }

        // --- RUTA: /api/auth/logout ---
        if (path === '/api/auth/logout' && method === 'POST') {
            localStorage.removeItem('usuarioLogueado');
            localStorage.removeItem('rolUsuario');
            localStorage.removeItem('usuarioLogueadoNombre');
            return jsonResponse({ mensaje: "Sesión cerrada" });
        }

        // --- RUTA: /api/auth/mi-cuenta ---
        if (path === '/api/auth/mi-cuenta') {
            if (method === 'GET') {
                return jsonResponse({
                    nombre: localStorage.getItem('usuarioLogueadoNombre') || 'Edgar Beekeep',
                    email: localStorage.getItem('usuarioLogueado') || 'edgar@sam.com',
                    telefono: "+52 961 123 4567"
                });
            }
            if (method === 'PUT') {
                localStorage.setItem('usuarioLogueado', body.email);
                localStorage.setItem('usuarioLogueadoNombre', body.nombre);
                
                // Actualizar en el array de usuarios
                let users = JSON.parse(localStorage.getItem('usuarios'));
                let userIdx = users.findIndex(u => u.email === body.email);
                if (userIdx !== -1) {
                    users[userIdx].nombre = body.nombre;
                }
                localStorage.setItem('usuarios', JSON.stringify(users));

                return jsonResponse({ mensaje: "Datos actualizados correctamente" });
            }
        }

        // --- RUTA: /api/dashboard ---
        if (path === '/api/dashboard' && method === 'GET') {
            let colmenas = JSON.parse(localStorage.getItem('colmenas'));
            let apiarios = JSON.parse(localStorage.getItem('apiarios'));
            let alertas = JSON.parse(localStorage.getItem('alertas'));
            let cosechas = JSON.parse(localStorage.getItem('cosechas'));

            let totalColmenas = colmenas.length;
            let activas = colmenas.filter(c => c.estado === 'verde').length;
            let alertasActivas = alertas.filter(a => !a.atendida).length;

            let totalKg = cosechas.reduce((sum, c) => sum + (parseFloat(c.kg) || 0), 0);

            // Armar apiarios para el dashboard
            let dashboardApiarios = apiarios.map(ap => {
                let colmenasCount = colmenas.filter(c => c.apiario_id === ap.id).length;
                let criticas = alertas.filter(al => {
                    let col = colmenas.find(c => c.id === al.colmena);
                    return col && col.apiario_id === ap.id && al.nivel === 'critica' && !al.atendida;
                }).length;
                let avisos = alertas.filter(al => {
                    let col = colmenas.find(c => c.id === al.colmena);
                    return col && col.apiario_id === ap.id && al.nivel === 'aviso' && !al.atendida;
                }).length;

                let estado = "verde";
                let estadoTexto = "Saludable";
                if (criticas > 0) {
                    estado = "rojo";
                    estadoTexto = "Crítico";
                } else if (avisos > 0) {
                    estado = "amarillo";
                    estadoTexto = "Aviso";
                }

                return {
                    id: ap.id,
                    nombre: ap.nombre,
                    ubicacion: `${ap.localidad}, ${ap.municipio}`,
                    colmenas: colmenasCount,
                    estado: estado,
                    estadoTexto: estadoTexto
                };
            });

            return jsonResponse({
                usuario: { nombre: localStorage.getItem('usuarioLogueadoNombre') },
                stats: {
                    produccionTotal: `${totalKg.toFixed(1)} kg`,
                    colmenasActivas: `${activas} / ${totalColmenas}`,
                    alertasActivas: alertasActivas,
                    apicultores: 3
                },
                apiarios: dashboardApiarios,
                produccionColmena: {
                    labels: ["C-01", "C-02", "C-03"],
                    data: [25.4, 18.2, 0]
                },
                produccionMensual: {
                    labels: ["Oct", "Nov", "Dic", "Ene", "Feb", "Mar"],
                    data: [45, 60, 30, 0, 10, 80]
                }
            });
        }

        // --- RUTA: /api/dashboard/apiario/{id} ---
        if (path.startsWith('/api/dashboard/apiario/')) {
            const apiarioId = parseInt(path.split('/').pop());
            let apiarios = JSON.parse(localStorage.getItem('apiarios'));
            let colmenas = JSON.parse(localStorage.getItem('colmenas'));

            let ap = apiarios.find(a => a.id === apiarioId);
            if (!ap) return jsonResponse({ mensaje: "Apiario no encontrado" }, 404);

            let colmenasFiltradas = colmenas.filter(c => c.apiario_id === apiarioId && c.estado !== 'de_baja').map(c => {
                return {
                    id: c.id,
                    estado: c.estado,
                    estadoTexto: c.estadoTexto,
                    peso: c.id === 'C-01' ? '42.5' : (c.id === 'C-02' ? '38.1' : '--'),
                    temp: c.id === 'C-01' ? '34.2' : (c.id === 'C-02' ? '35.8' : '--'),
                    humedad: c.id === 'C-01' ? '60.5' : (c.id === 'C-02' ? '65.2' : '--')
                };
            });

            return jsonResponse({
                usuario: { nombre: localStorage.getItem('usuarioLogueadoNombre') },
                apiario: { nombre: ap.nombre, ubicacion: `${ap.localidad}, ${ap.municipio}` },
                colmenas: colmenasFiltradas
            });
        }

        // --- RUTA: /api/dashboard/colmena ---
        if (path === '/api/dashboard/colmena') {
            const colmenaId = searchParams.get('id');
            let colmenas = JSON.parse(localStorage.getItem('colmenas'));
            let col = colmenas.find(c => c.id === colmenaId || String(c.db_id) === colmenaId);

            if (!col) return jsonResponse({ mensaje: "Colmena no encontrada" }, 404);

            let visitas = JSON.parse(localStorage.getItem('visitas')).filter(v => v.colmena === col.id);

            return jsonResponse({
                codigo: col.id,
                apiario: col.apiario,
                ecotipo: col.ecotipo,
                iaDiagnostico: {
                    estado: col.estado === 'verde' ? 'Normal' : 'Atención Requerida',
                    mensaje: col.estado === 'verde' 
                        ? 'Colmena saludable, no se detectan anomalías de temperatura o peso'
                        : 'Alerta de temperatura elevada detectada por el sensor'
                },
                lecturas: [
                    { timestamp: "12:00", peso: 42.5, temp: 34.2, hum: 60.5 },
                    { timestamp: "13:00", peso: 42.8, temp: 34.5, hum: 61.0 },
                    { timestamp: "14:00", peso: 43.1, temp: 34.8, hum: 60.8 }
                ],
                alertas: col.estado === 'rojo' ? [
                    { nivel: "critica", mensaje: "Temperatura elevada en colmena" }
                ] : [],
                historial: visitas.map(v => ({
                    fecha: v.fecha,
                    apicultor: v.apicultor,
                    tipo: "Inspección",
                    detalles: `${v.estadoColonia} · ${v.notas}`
                }))
            });
        }

        // --- RUTA: /api/gestion/colmenas ---
        if (path === '/api/gestion/colmenas') {
            let colmenas = JSON.parse(localStorage.getItem('colmenas')).filter(c => c.estado !== 'de_baja');

            if (method === 'GET') {
                return jsonResponse(colmenas);
            }
            if (method === 'POST') {
                let apiarios = JSON.parse(localStorage.getItem('apiarios'));
                let ap = apiarios.find(a => String(a.id) === String(body.apiario_id));

                let newCol = {
                    db_id: Date.now(),
                    id: body.codigo,
                    apiario: ap ? ap.nombre : 'Desconocido',
                    apiario_id: parseInt(body.apiario_id),
                    monitoreo: "Sin asignar",
                    ecotipo: body.ecotipo || "Apis mellifera",
                    estado: "verde",
                    estadoTexto: "Saludable"
                };

                let list = JSON.parse(localStorage.getItem('colmenas'));
                list.push(newCol);
                localStorage.setItem('colmenas', JSON.stringify(list));

                return jsonResponse({ mensaje: "Colmena creada" });
            }
        }

        // --- RUTA: /api/gestion/colmenas/{id} ---
        if (path.startsWith('/api/gestion/colmenas/')) {
            const id = parseInt(path.split('/').pop());
            let list = JSON.parse(localStorage.getItem('colmenas'));

            if (method === 'PUT') {
                let idx = list.findIndex(c => c.db_id === id);
                if (idx !== -1) {
                    list[idx].id = body.codigo;
                    list[idx].ecotipo = body.ecotipo;
                }
                localStorage.setItem('colmenas', JSON.stringify(list));
                return jsonResponse({ mensaje: "Colmena actualizada" });
            }

            if (method === 'DELETE') {
                let idx = list.findIndex(c => c.db_id === id);
                if (idx !== -1) {
                    list[idx].estado = 'de_baja';
                }
                localStorage.setItem('colmenas', JSON.stringify(list));
                return jsonResponse({ mensaje: "Colmena dada de baja" });
            }
        }

        // --- RUTA: /api/gestion/apiarios ---
        if (path === '/api/gestion/apiarios') {
            let apiarios = JSON.parse(localStorage.getItem('apiarios')).filter(a => a.estado !== 'de_baja');
            let colmenas = JSON.parse(localStorage.getItem('colmenas')).filter(c => c.estado !== 'de_baja');

            if (method === 'GET') {
                let res = apiarios.map(ap => {
                    let colCount = colmenas.filter(c => c.apiario_id === ap.id).length;
                    return {
                        id: ap.id,
                        nombre: ap.nombre,
                        estado: ap.estado,
                        municipio: ap.municipio,
                        localidad: ap.localidad,
                        colmenas: colCount,
                        microclima: ap.microclima || "Templado",
                        microclima_id: ap.microclima_id || 1
                    };
                });
                return jsonResponse(res);
            }

            if (method === 'POST') {
                let newAp = {
                    id: Date.now(),
                    nombre: body.nombre,
                    estado: "Activo",
                    municipio: body.municipio,
                    localidad: body.localidad,
                    colmenas: 0,
                    microclima: body.microclima_id == 2 ? "Cálido" : "Templado",
                    microclima_id: parseInt(body.microclima_id)
                };

                let list = JSON.parse(localStorage.getItem('apiarios'));
                list.push(newAp);
                localStorage.setItem('apiarios', JSON.stringify(list));

                return jsonResponse({ mensaje: "Apiario creado" });
            }
        }

        // --- RUTA: /api/gestion/apiarios/{id} ---
        if (path.startsWith('/api/gestion/apiarios/')) {
            const id = parseInt(path.split('/').pop());
            let list = JSON.parse(localStorage.getItem('apiarios'));

            if (method === 'PUT') {
                let idx = list.findIndex(a => a.id === id);
                if (idx !== -1) {
                    list[idx].nombre = body.nombre;
                    list[idx].municipio = body.municipio;
                    list[idx].localidad = body.localidad;
                    list[idx].microclima_id = parseInt(body.microclima_id);
                    list[idx].microclima = body.microclima_id == 2 ? "Cálido" : "Templado";
                }
                localStorage.setItem('apiarios', JSON.stringify(list));
                return jsonResponse({ mensaje: "Apiario actualizado" });
            }

            if (method === 'DELETE') {
                // Dar de baja lógica al apiario
                let idx = list.findIndex(a => a.id === id);
                if (idx !== -1) {
                    list[idx].estado = 'de_baja';
                }
                localStorage.setItem('apiarios', JSON.stringify(list));

                // Dar de baja las colmenas asociadas
                let colmenas = JSON.parse(localStorage.getItem('colmenas'));
                colmenas.forEach((c, index) => {
                    if (c.apiario_id === id) {
                        colmenas[index].estado = 'de_baja';
                    }
                });
                localStorage.setItem('colmenas', JSON.stringify(colmenas));

                return jsonResponse({ mensaje: "Apiario dado de baja con éxito" });
            }
        }

        // --- RUTA: /api/gestion/usuarios ---
        if (path === '/api/gestion/usuarios' && method === 'GET') {
            let users = JSON.parse(localStorage.getItem('usuarios'));
            return jsonResponse(users);
        }

        // --- RUTA: /api/gestion/usuarios (POST) ---
        if (path === '/api/gestion/usuarios' && method === 'POST') {
            let newUsr = {
                id: Date.now(),
                nombre: body.nombre,
                email: body.email,
                rol: body.rol_id == 1 ? "admin" : "apicultor",
                activo: true
            };
            let list = JSON.parse(localStorage.getItem('usuarios'));
            list.push(newUsr);
            localStorage.setItem('usuarios', JSON.stringify(list));
            return jsonResponse({ mensaje: "Usuario creado" });
        }

        // --- RUTA: /api/gestion/usuarios/{id} (DELETE/PUT) ---
        if (path.startsWith('/api/gestion/usuarios/')) {
            const id = parseInt(path.split('/').pop());
            let list = JSON.parse(localStorage.getItem('usuarios'));

            if (method === 'PUT') {
                let idx = list.findIndex(u => u.id === id);
                if (idx !== -1) {
                    list[idx].nombre = body.nombre;
                    list[idx].email = body.email;
                    list[idx].rol = body.rol_id == 1 ? "admin" : "apicultor";
                }
                localStorage.setItem('usuarios', JSON.stringify(list));
                return jsonResponse({ mensaje: "Usuario actualizado" });
            }

            if (method === 'DELETE') {
                let filtered = list.filter(u => u.id !== id);
                localStorage.setItem('usuarios', JSON.stringify(filtered));
                return jsonResponse({ mensaje: "Usuario eliminado" });
            }
        }

        // --- RUTA: /alertas ---
        if (path === '/alertas') {
            let alertas = JSON.parse(localStorage.getItem('alertas'));
            if (method === 'GET') {
                return jsonResponse(alertas);
            }
        }

        // --- RUTA: /alertas/{id} (PUT) ---
        if (path.startsWith('/alertas/')) {
            const id = parseInt(path.split('/').pop());
            let list = JSON.parse(localStorage.getItem('alertas'));
            let idx = list.findIndex(a => a.id === id);
            
            if (idx !== -1) {
                list[idx].atendida = true;
                list[idx].nivel = 'atendida';
            }
            localStorage.setItem('alertas', JSON.stringify(list));
            
            // También restablecer estado de la colmena a verde si ya no hay alertas activas
            let alerta = list[idx];
            if (alerta) {
                let colmenas = JSON.parse(localStorage.getItem('colmenas'));
                let colIdx = colmenas.findIndex(c => c.id === alerta.colmena);
                if (colIdx !== -1) {
                    colmenas[colIdx].estado = 'verde';
                    colmenas[colIdx].estadoTexto = 'Saludable';
                }
                localStorage.setItem('colmenas', JSON.stringify(colmenas));
            }

            return jsonResponse({ mensaje: "Alerta actualizada" });
        }

        // --- RUTA: /visitas ---
        if (path === '/visitas') {
            let visitas = JSON.parse(localStorage.getItem('visitas'));
            if (method === 'GET') {
                return jsonResponse(visitas);
            }
            if (method === 'POST') {
                let colmenas = JSON.parse(localStorage.getItem('colmenas'));
                let col = colmenas.find(c => String(c.db_id) === String(body.colmena_id));

                let newVis = {
                    fecha: body.fecha,
                    colmena: col ? col.id : 'C-01',
                    apicultor: localStorage.getItem('usuarioLogueadoNombre') || 'Edgar Beekeep',
                    estado_colonia: body.estado_colonia,
                    reina: body.reina_vista ? "Vista" : "No vista",
                    notes: body.notas || "",
                    notas: body.notas || ""
                };
                visitas.push(newVis);
                localStorage.setItem('visitas', JSON.stringify(visitas));

                // Si cosechó miel
                if (parseFloat(body.kg_cosechados) > 0) {
                    let cosechas = JSON.parse(localStorage.getItem('cosechas'));
                    let newCos = {
                        id: Date.now(),
                        fecha: body.fecha,
                        colmena: col ? col.id : 'C-01',
                        apiario: col ? col.apiario : 'Apiario Colima',
                        apicultor: localStorage.getItem('usuarioLogueadoNombre') || 'Edgar Beekeep',
                        kg: parseFloat(body.kg_cosechados),
                        calidad: body.calidad_miel || "Normal"
                    };
                    cosechas.push(newCos);
                    localStorage.setItem('cosechas', JSON.stringify(cosechas));
                }

                return jsonResponse({ mensaje: "Visita y registros guardados con éxito", id: Date.now() });
            }
        }

        // --- RUTA: /cosechas ---
        if (path === '/cosechas' && method === 'GET') {
            let cosechas = JSON.parse(localStorage.getItem('cosechas'));
            return jsonResponse(cosechas);
        }

        // --- RUTA: /cosechas/resumen ---
        if (path === '/cosechas/resumen' && method === 'GET') {
            let cosechas = JSON.parse(localStorage.getItem('cosechas'));
            let total = cosechas.reduce((sum, c) => sum + c.kg, 0);
            return jsonResponse({ totalCosechado: total });
        }

        // --- RUTA: /api/gestion/microclimas ---
        if (path === '/api/gestion/microclimas' && method === 'GET') {
            return jsonResponse([
                { id: 1, nombre: "Templado" },
                { id: 2, nombre: "Cálido" },
                { id: 3, nombre: "Húmedo" }
            ]);
        }

        // Fallback: si no es ninguna ruta mockeada, usar fetch original
        return originalFetch(input, init);
    };
})();
