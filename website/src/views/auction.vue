<template>
  <v-container
    v-if="loadingText !== null"
    class="d-flex align-center justify-center flex-column fill-height"
  >
    <v-progress-circular indeterminate :size="96" color="primary" />
    <h4 class="text-h4 mt-12">{{ loadingText }}</h4>
  </v-container>
  <v-main v-else class="fill-win-height">
    <v-overlay absolute :value="paused">
      <v-card outlined light class="d-flex flex-column">
        <v-icon :size="128" class="align-self-center" color="primary">mdi-pause</v-icon>
        <v-divider />
        <v-card-title>Aukcja wstrzymana</v-card-title>
        <v-card-actions>
          <v-btn block outlined color="primary" @click="resume">Wznów</v-btn>
        </v-card-actions>
      </v-card>
    </v-overlay>
      <v-app-bar app>
        <v-btn icon large to="/">
          <v-icon>
            mdi-arrow-left
          </v-icon>
        </v-btn>
        <v-spacer />
        <div v-if="$vuetify.breakpoint.width > 360">
          Kod: <b>{{ code }}</b>
        </div>
        <qr-dialog :code="code">
          <template #activator="{ on }">
            <v-btn icon class="ml-1" v-on="on">
              <v-icon>
                mdi-qrcode
              </v-icon>
            </v-btn>
          </template>
        </qr-dialog>
        <v-btn icon class="ml-1" @click="pause" v-if="state === 'in-progress'">
          <v-icon>mdi-pause</v-icon>
        </v-btn>
        <v-btn v-if="isFullscreen" icon class="ml-1" @click="exitFullscreen">
          <v-icon >
            mdi-fullscreen-exit
          </v-icon>
        </v-btn>
        <v-btn v-else icon class="ml-1" @click="requestFullscreen">
          <v-icon>
            mdi-fullscreen
          </v-icon>
        </v-btn>
        <create-player-dialog
          v-if="selfPlayer === null"
          :socket="socket"
          :players-array="playersArray"
        >
          <template #activator="{ on }">
            <v-btn
              color="primary"
              class="ml-1"
              v-on="on"
            >
              Graj
            </v-btn>
          </template>
        </create-player-dialog>
      </v-app-bar>
    <not-started-screen
      v-if="state === 'not-started'"
      :players-array="playersArray"
      :self-player="selfPlayer"
      :socket="socket"
      :options="options"
      :player-id="playerId"
    />
    <v-container
      v-else-if="state === 'countdown'"
      class="auction-countdown-screen fill-height d-flex align-center justify-center text-center"
    >
      <h2 class="text-h4 text-sm-h3" v-if="countdownTime === null">Startowanie</h2>
      <h1 class="countdown-time" v-else>{{ countdownTime }}</h1>
    </v-container>
    <british-auction-screen
      v-else-if="options.type === 'british'"
      :options="options"
      :self-player="selfPlayer"
      :socket="socket"
      :bid-history="bidHistory"
      :players="players"
      :end-timestamp="endTimestamp"
      :finished="state === 'finished'"
      :locked="locked"
    />
    <dutch-auction-screen
      v-else-if="options.type === 'dutch'"
      :options="options"
      :socket="socket"
      :current-price="currentPrice"
      :finished="state === 'finished'"
      :buyer="buyer"
      :players="players"
      :self-player="selfPlayer"
    />
  </v-main>
</template>

<script>
import { io } from 'socket.io-client';
import QrDialog from '@/components/qr-dialog.vue';
import CreatePlayerDialog from '@/components/create-player-dialog.vue';
import _ from 'lodash';
import NotStartedScreen from '@/components/auction-screens/not-started-screen.vue';
import BritishAuctionScreen from '@/components/auction-screens/british-auction-screen.vue';
import DutchAuctionScreen from '@/components/auction-screens/dutch-auction-screen.vue';

export default {
  components: {
    DutchAuctionScreen,
    BritishAuctionScreen,
    NotStartedScreen,
    CreatePlayerDialog,
    QrDialog,
  },
  data: () => ({
    playerId: null,
    socket: null,
    connected: false,

    code: null,
    options: null,
    players: null,
    state: null,
    bidHistory: null,
    currentPrice: null,
    buyer: null,
    paused: null,

    countdownTime: null,
    endTimestamp: null,
    lockTimeoutId: null,
    isFullscreen: false,
  }),
  created() {
    navigator.vibrate(0);
    const roomString = sessionStorage.getItem('room');
    if (roomString === null) this.$router.push('/');
    const room = JSON.parse(roomString);
    this.playerId = room.playerId;
    const url = new URL(`/room/${room.roomId}`, this.$app.serverHost).toString();
    this.socket = io(url, {
      auth: {
        roomAccessToken: `bearer ${room.token}`,
      },
    });
    this.socket.on('update:code', (code) => { this.code = code; });
    this.socket.on('update:auction-options', (options) => { this.options = options; });
    this.socket.on('update:players', (players) => { this.players = players; });
    this.socket.on('update:state', (state) => { this.state = state; });
    this.socket.on('update:bid-history', (history) => { this.bidHistory = history; });
    this.socket.on('update:current-price', (price) => { this.currentPrice = price; });
    this.socket.on('update:buyer', (buyer) => { this.buyer = buyer; });
    this.socket.on('update:paused', (paused) => { this.paused = paused; });
    this.socket.on('time-left', (timeLeft) => {
      if (timeLeft === null) this.endTimestamp = null;
      else this.endTimestamp = Date.now() + timeLeft;
    });
    this.socket.on('lock', () => {
      if (this.lockTimeoutId !== null) clearTimeout(this.lockTimeoutId);
      this.lockTimeoutId = setTimeout(() => {
        this.lockTimeoutId = null;
      }, 500);
    });
    this.socket.on('connect', () => {
      this.code = null;
      this.options = null;
      this.players = null;
      this.state = null;
      this.bidHistory = null;
      this.currentPrice = null;
      this.buyer = null;
      this.paused = null;

      this.countdownTime = null;
      this.connected = true;
    });
    this.socket.on('disconnect', () => {
      this.connected = false;
      if (this.lockTimeoutId !== null) {
        clearTimeout(this.lockTimeoutId);
        this.lockTimeoutId = null;
      }
    });
    this.socket.on('connect_error', (error) => {
      console.error(error);
      this.$router.push('/');
    });
    this.updateIsFullscreen();
    document.addEventListener('fullscreenchange', this.updateIsFullscreen);
  },
  methods: {
    async requestFullscreen() {
      await document.documentElement.requestFullscreen({
        navigationUI: 'hide',
      });
    },
    async exitFullscreen() {
      await document.exitFullscreen();
    },
    updateIsFullscreen() {
      this.isFullscreen = document.fullscreenElement !== null;
    },
    async countdown() {
      for (let i = 3; i > 0; i -= 1) {
        this.countdownTime = i;
        navigator.vibrate(200);
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      navigator.vibrate(500);
    },
    pause() {
      this.socket.emit('pause');
    },
    resume() {
      this.socket.emit('resume');
    },
  },
  computed: {
    loadingText() {
      if (!this.connected) return 'Łączenie z serwerem';
      if (!this.options) return 'Wczytywanie opcji aukcji';
      if (!this.players) return 'Wczytywanie listy graczy';
      if (!this.state) return 'Wczytywanie stanu gry';
      if (this.paused === null) return 'Wczytywanie informacji o pauzie';
      if (this.options.type === 'british') {
        if (!this.bidHistory) return 'Wczytywanie historii ofert';
      }
      if (this.options.type === 'dutch') {
        if (['in-progress', 'finished'].includes(this.state) && this.currentPrice === null) return 'Wczytywanie aktualnej ceny';
      }
      return null;
    },
    selfPlayer() {
      return this.players[this.playerId] || null;
    },
    playersArray() {
      return _.values(this.players);
    },
    locked() {
      return this.lockTimeoutId !== null;
    },
  },
  watch: {
    state: {
      handler(value, oldValue) {
        if (value === 'countdown') {
          if (oldValue === 'not-started') this.countdown();
          else this.countdownTime = null;
        }
      },
      immediate: true,
    },
  },
  destroyed() {
    if (document.fullscreenElement !== null) document.exitFullscreen();
    document.removeEventListener('fullscreenchange', this.updateIsFullscreen);
    if (this.socket) this.socket.close();
  },
};
</script>

<style lang="scss">
  .auction-countdown-screen {
    .countdown-time {
      font-size: 15em;
      font-weight: 300;
    }
  }
</style>
