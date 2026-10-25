<?php

// Solo las reglas que usa la API; los mensajes los lee una persona en la app.
return [
    'required' => 'Completa este dato.',
    'required_with' => 'Completa este dato.',
    'email' => 'Escribe un correo válido.',
    'unique' => 'Ya hay una cuenta con este correo.',
    'min' => ['string' => 'Debe tener al menos :min caracteres.', 'array' => 'Elige al menos una opción.'],
    'max' => ['string' => 'Debe tener como máximo :max caracteres.'],
    'digits' => 'El celular debe tener :digits dígitos.',
    'date_format' => 'Escribe la hora como 08:00.',
    'in' => 'Elige una opción de la lista.',
    'array' => 'Elige al menos una opción.',
    'boolean' => 'Debe ser sí o no.',
    'integer' => 'Debe ser un número.',
    'between' => ['numeric' => 'Debe estar entre :min y :max.'],
    'current_password' => 'La contraseña actual no es correcta.',
    'attributes' => [],
];
