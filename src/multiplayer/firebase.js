import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, push } from "firebase/database";
import { glider } from '@/glider/glider';
import { devlog } from "@/utils/devlog";

class Firebase {
  constructor() {
    this.app = null;
    this.db = null;

    this.id = '';
    this.nick = '';

    this.firebaseConfig = {
      apiKey: import.meta.env.VITE_API_KEY,
      authDomain: import.meta.env.VITE_AUTH_DOMAIN,
      databaseURL: import.meta.env.VITE_DATABASE_URL,
      projectId: import.meta.env.VITE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_APP_ID
    };
  }


  connect(id, nick, callback) {
    if (!this.app) this.app = initializeApp(this.firebaseConfig);
    if (!this.db) this.db = getDatabase();
    this.id = id;
    this.nick = nick;
    this.broadcast();    
    get(ref(this.db, 'users')).then((snapshot) => {
      callback(snapshot.val());
    });
  }

  broadcast() {
    devlog('broadcast',this.id);
    const time = new Date();
    const status = {
      nick: this.nick,
      x: glider.mesh.position.x,
      y: glider.mesh.position.y,
      yaw: glider.yaw,
      time: time.getTime(),
      date: time.toLocaleString(),
    };
    set(ref(this.db, 'users/' + this.id), status);
  }

  // listenMultiplayer() { 
  //   onValue(listenRef, (snapshot) => {
  //     const users = snapshot.val();
  //     peers = [];
  //     for (let id in users) {
  //       if (id == userId) continue;
  //       const user = users[id];
  //       user.id = id;
  //       if (Date.now() - user.time > 2000) continue;
  //       peers.push(user);
  //     }
  //   });
  // }
}
  
export const firebase = new Firebase();