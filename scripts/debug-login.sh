#!/bin/bash

# Script para debuggear el login desde el navegador

echo "🔍 Debug del Login"
echo "=================="
echo ""
echo "Por favor, abre la consola del navegador (F12) y:"
echo ""
echo "1. Ve a la pestaña 'Network'"
echo "2. Intenta hacer login"
echo "3. Busca la petición a '/api/auth/login'"
echo "4. Revisa:"
echo "   - Status code"
echo "   - Request Payload (qué está enviando)"
echo "   - Response (qué está recibiendo)"
echo ""
echo "También puedes ejecutar esto en la consola del navegador:"
echo ""
cat << 'JAVASCRIPT'
// Ejecutar esto en la consola del navegador después de intentar login
const testLogin = async () => {
  try {
    const response = await fetch('https://YOUR_DOMAIN.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'user@example.com',  // Cambia esto por tu email
        password: 'YOUR_PASSWORD'   // Cambia esto por tu contraseña
      })
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', data);
    
    if (data.success) {
      console.log('✅ Login exitoso!');
      console.log('User:', data.data.user.email);
    } else {
      console.log('❌ Login falló:', data.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

testLogin();
JAVASCRIPT

echo ""
echo "También verifica en la consola si hay errores de CORS o de red."
echo ""
