import http from 'k6/http';
import { check, group } from 'k6';
import { Trend } from 'k6/metrics';
import { sleep } from 'k6';

export let options = {
  vus: 10,
  duration: '30s',
};

let responseTimeTrend = new Trend('response_time');

export default function () {
  // Gera um IP diferente por VU
  const fakeIP = `192.168.1.${__VU}`;

  group('GET Random Joke', function () {
    let res = http.get('https://official-joke-api.appspot.com/random_joke', {
      headers: {
        'X-Forwarded-For': fakeIP,
      },
    });

    // Adiciona ao trend customizado
    responseTimeTrend.add(res.timings.duration);

    // Log leve no terminal (funciona no cloud também)
    console.log(`VU: ${__VU}, Fake IP: ${fakeIP}, Status: ${res.status}, Time: ${res.timings.duration}ms`);

    check(res, {
      'status code is 200': (r) => r.status === 200,
      'response is JSON': (r) => r.headers['Content-Type'].includes('application/json'),
      'has all required fields': (r) => {
        try {
          const json = r.json();
          return (
            json.hasOwnProperty('type') &&
            json.hasOwnProperty('setup') &&
            json.hasOwnProperty('punchline') &&
            json.hasOwnProperty('id')
          );
        } catch (e) {
          return false;
        }
      },
      'fields have correct types': (r) => {
        try {
          const json = r.json();
          return (
            typeof json.id === 'number' &&
            typeof json.type === 'string' &&
            typeof json.setup === 'string' &&
            typeof json.punchline === 'string'
          );
        } catch (e) {
          return false;
        }
      },
      'setup and punchline are not empty': (r) => {
        try {
          const json = r.json();
          return json.setup.trim().length > 0 && json.punchline.trim().length > 0;
        } catch (e) {
          return false;
        }
      },
    });
  });

  sleep(1);
}
