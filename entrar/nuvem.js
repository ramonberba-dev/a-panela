/* Conexão da Área do participante com o Firebase (login e banco de dados).
   As chaves abaixo são públicas por natureza (identificam o projeto); quem protege os dados
   são as regras de segurança do Firestore, configuradas no console do Firebase. */
window.NUVEM = (function () {
  if (!window.firebase || !firebase.initializeApp) return null;
  try {
    firebase.initializeApp({
      apiKey: "AIzaSyDcZcHk3Lu0zOgoiNctwZ3qBhmBwMu0VRE",
      authDomain: "a-panela-9063d.firebaseapp.com",
      projectId: "a-panela-9063d",
      storageBucket: "a-panela-9063d.firebasestorage.app",
      messagingSenderId: "1028418049352",
      appId: "1:1028418049352:web:2473b11b41a969cfb18f7d"
    });
    var auth = firebase.auth(); auth.languageCode = "pt";
    var google = new firebase.auth.GoogleAuthProvider(); google.setCustomParameters({ prompt: "select_account" });
    return { auth: auth, db: firebase.firestore(), google: google, agora: function () { return firebase.firestore.FieldValue.serverTimestamp(); } };
  } catch (e) { return null; }
})();
