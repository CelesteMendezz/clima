if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/ws.js')
            .then((registration) => {
                console.log('Service Worker registrado', registration.scope);
                
                const notificarBtn = document.getElementById('notificar');
                if (notificarBtn) {
                    notificarBtn.addEventListener('click', () => {
                        if (Notification.permission === "granted") {
                            registration.active.postMessage({ type: 'SHOW_NOTIFICATION' });
                        } else if (Notification.permission !== "denied") {
                            Notification.requestPermission().then(permission => {
                                if (permission === "granted") {
                                    registration.active.postMessage({ type: 'SHOW_NOTIFICATION' });
                                }
                            });
                        }
                    });
                }
            })
            .catch((error) => {
                console.log('Error al registrar el Service Worker:', error);
            });
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    actualizarFecha();

    const cache = await caches.open('clima-cache');
    const match = await cache.match('/ultimaCiudad');
    let ultimaCiudad = 'Tizayuca';
    if (match) {
        ultimaCiudad = await match.text();
    }
    
    obtenerclima(ultimaCiudad);
    obtenerPronostico(ultimaCiudad);
});


document.getElementById('btn').addEventListener('click', function () {
    const inputCiudad = document.getElementById('caja');
    const ciudad = inputCiudad.value.trim();
    if (ciudad === "") {
        alert("Por favor ingresa una ciudad");
        return;
    }
    obtenerclima(ciudad);
    obtenerPronostico(ciudad);
    
   
    inputCiudad.value = "";
});


async function obtenerclima(ciudad) {
    const apikey = '4946d88cc71b128054e8222453cdbb76';
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${ciudad}&appid=${apikey}&units=metric&lang=es`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Ciudad no encontrada');
        const data = await response.json();
        mostrarclima(data);

        caches.open('clima-cache').then(cache => cache.put(url, new Response(JSON.stringify(data))));

        caches.open('clima-cache').then(cache => {
            cache.put('/ultimaCiudad', new Response(ciudad));
        });
    } catch (error) {
        console.error("Error al obtener el clima", error);


        const cacheResponse = await caches.match(url);
        if (cacheResponse) {
            const cachedData = await cacheResponse.json();
            mostrarclima(cachedData);
        } else {
            document.getElementById('weatherresult').innerHTML = `<p class='text-danger'>Error: Ciudad no encontrada</p>`;
        }
    }
}


async function obtenerPronostico(ciudad) {
    const apikey = '4946d88cc71b128054e8222453cdbb76';
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${ciudad}&appid=${apikey}&units=metric&lang=es`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error al obtener el pronóstico');
        const data = await response.json();
        mostrarPronostico(data);

        caches.open('clima-cache').then(cache => cache.put(url, new Response(JSON.stringify(data))));

    } catch (error) {
        console.error("Error al obtener el pronóstico", error);

       
        const cacheResponse = await caches.match(url);
        if (cacheResponse) {
            const cachedData = await cacheResponse.json();
            mostrarPronostico(cachedData);
        } else {
            document.getElementById('forecast-container').innerHTML = `<p class='text-danger'>No se pudo obtener el pronóstico</p>`;
        }
    }
}


function mostrarclima(data) {
    document.getElementById('ciudadNombre').textContent = data.name;
    const weatherresult = document.getElementById('weatherresult');
    weatherresult.innerHTML = `
    <div class="clima-container d-flex align-items-center justify-content-center gap-3">
        <h2 class="temperatura m-0">${Math.round(data.main.temp)}°C</h2>
        <p class="descripcion m-0">
            ${data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1)}
        </p>
    </div>
    `;

    document.getElementById('humedad').textContent = `${data.main.humidity}%`;
    document.getElementById('viento').textContent = `${data.wind.speed} km/h`;
    changeBackgroundAndImage(data.weather[0].main);
}


function mostrarPronostico(data) {
    const timeTaken = '12:00:00';
    const todayDate = new Date().toISOString().split('T')[0];

    const fiveDayForecast = data.list.filter(forecastWeather => {
        const forecastDate = forecastWeather.dt_txt.split(' ')[0];
        return forecastWeather.dt_txt.includes(timeTaken) && forecastDate !== todayDate;
    });

    const forecastContainer = document.getElementById('forecast-container');
    forecastContainer.innerHTML = "";

    fiveDayForecast.forEach(forecast => {
        const fechaStr = forecast.dt_txt.split(' ')[0];
        const fechaObj = new Date(fechaStr);
        
        const dia = String(fechaObj.getDate()).padStart(2, '0');
        const mes = String(fechaObj.getMonth() + 1).padStart(2, '0');
        const anio = fechaObj.getFullYear();
        const fechaFormateada = `${dia}-${mes}-${anio}`;

        const temperatura = Math.round(forecast.main.temp);
        const weather = forecast.weather[0].main;
        let iconoClima = "/images/cargando.png";

        switch (weather) {
            case 'Clear': iconoClima = '/images/sun.png'; break;
            case 'Clouds': iconoClima = '/images/clouds.png'; break;
            case 'Rain': iconoClima = '/images/rainy.png'; break;
            case 'Fog': iconoClima = '/images/fog.png'; break;
            case 'Snow': iconoClima = '/images/snow.png'; break;
            case 'Storm': iconoClima = '/images/storm.png'; break;
            case 'Wind': iconoClima = '/images/wind.png'; break;
            default: iconoClima = '/images/cargando.png'; break;
        }

        forecastContainer.innerHTML += `
        <div class="forecast-card">
            <p><strong>${fechaFormateada}</strong></p>
            <img src="${iconoClima}" alt="Icono clima">
            <p>${temperatura}°C</p>
        </div>
        `;
    });
}


function actualizarFecha() {
    const fecha = new Date();
    const opciones = { weekday: 'long', day: 'numeric', month: 'long' };
    document.getElementById('fecha').textContent = fecha.toLocaleDateString('es-ES', opciones);
}


function changeBackgroundAndImage(weather) {
    const body = document.body;
    const weatherImage = document.getElementById('weatherImage');
    
    switch (weather) {
        case 'Clear':
            body.style.background = 'linear-gradient(120deg, #f6d365 0%, #fda085 100%)';
            weatherImage.src = '/images/sun.png';
            break;
        case 'Clouds':
            body.style.background = 'linear-gradient(to top, #cfd9df 0%, #e2ebf0 100%)';
            weatherImage.src = '/images/clouds.png';
            break;
        case 'Rain':
            body.style.background = 'linear-gradient(to top, #00c6fb 0%, #005bea 100%);';
            weatherImage.src = '/images/rainy.png';
            break;
        case 'Fog':
            body.style.background = 'linear-gradient(to top, #00c6fb 0%, #005bea 100%);';
            weatherImage.src = '/images/fog.png';
            break; 
        case 'Snow':
            body.style.background = 'linear-gradient(to top, #00c6fb 0%, #005bea 100%);';
            weatherImage.src = '/images/snow.png';
            break; 
        case 'Storm':
            body.style.background = 'linear-gradient(to top, #00c6fb 0%, #005bea 100%);';
            weatherImage.src = '/images/storm.png';
            break;
        case 'Wind':
            body.style.background = 'linear-gradient(to top, #00c6fb 0%, #005bea 100%);';
            weatherImage.src = '/images/wind.png';
            break;           
        default:
            body.style.background = 'linear-gradient(to right, #74ebd5, #acb6e5)';
            weatherImage.src = '/images/cargando.png';
            break;
    }
}





