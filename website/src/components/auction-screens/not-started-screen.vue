<template>
  <v-container
    class="
      auction-not-started-screen fill-height flex-column
      align-stretch justify-center overflow-y-auto flex-nowrap
    "
  >
    <v-expand-transition>
      <v-alert
        v-if="selfPlayer === null"
        color="amber"
        dismissible
        icon="mdi-alert"
        text
      >
        Jesteś w trybie obserwatora. Naciśnij przycisk <b>graj</b>, aby wziąć udział w aukcji.
      </v-alert>
    </v-expand-transition>
    <v-card outlined class="mb-4">
      <v-card-title>Zasady aukcji</v-card-title>
      <v-list subheader>
        <!--          <v-list-item>-->
        <!--            <v-list-item-content>-->
        <!--              <v-list-item-subtitle class="text-overline">
        Typ aukcji
        </v-list-item-subtitle>-->
        <!--              <v-list-item-title>Licytacja angielska</v-list-item-title>-->
        <!--            </v-list-item-content>-->
        <!--          </v-list-item>-->
        <v-list-item>
          <v-list-item-content>
            <v-list-item-subtitle class="text-overline">Mnożnik</v-list-item-subtitle>
            <v-list-item-title>
              {{ options.multiplier }} {{ options.currency }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item>
          <v-list-item-content>
            <v-list-item-subtitle class="text-overline">Cena wywoławcza</v-list-item-subtitle>
            <v-list-item-title>
              {{ options.startingPrice }} {{ options.currency }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item>
          <v-list-item-content>
            <v-list-item-subtitle class="text-overline">Kwota postąpienia</v-list-item-subtitle>
            <v-list-item-title>
              {{ options.minIncrement }} {{ options.currency }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item>
          <v-list-item-content>
            <v-list-item-subtitle class="text-overline">Czas na ofertę</v-list-item-subtitle>
            <v-list-item-title>{{ timePerBidString }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-card>
    <v-card outlined class="mb-4">
      <div class="d-flex align-center">
        <v-card-title class="grow">Lista graczy</v-card-title>
        <create-player-dialog
          v-if="selfPlayer === null"
          :socket="socket"
          :players-array="playersArray"
        >
          <template #activator="{ on }">
            <v-btn color="primary" class="my-2 mr-4" v-on="on">
              Graj
            </v-btn>
          </template>
        </create-player-dialog>
      </div>
      <h4
        v-if="playersArray.length === 0"
        class="subtitle-1 text-center px-2 py-4 text--secondary"
      >
        Nie ma jeszcze żadnego gracza
      </h4>
      <v-card-text class="d-flex flex-column pb-2" v-else>
        <v-sheet
          v-for="player in playersArray"
          :key="player.id"
          :color="player.color"
          rounded
          class="px-4 py-2 mb-2 text-subtitle-1 text-center"
        >
          {{ player.name }}
          <span class="font-weight-thin" v-if="player.id === playerId">(ty)</span>
        </v-sheet>
      </v-card-text>
    </v-card>
    <v-btn
      large
      color="primary"
      block
      :disabled="playersArray.length < 2"
      @click="startAuction"
      class="shrink"
    >
      Rozpocznij aukcję
    </v-btn>
  </v-container>
</template>

<script>
import CreatePlayerDialog from '@/components/create-player-dialog.vue';

export default {
  components: {
    CreatePlayerDialog,
  },
  props: {
    playersArray: {
      type: Array,
      required: true,
    },
    socket: {
      type: Object,
      required: true,
    },
    selfPlayer: {
      type: Object,
      required: false,
      default: null,
    },
    playerId: {
      type: String,
      required: true,
    },
    options: {
      type: Object,
      required: true,
    },
  },
  computed: {
    timePerBidString() {
      const time = this.options.timePerBid / 1000;
      const strings = {
        one: 'sekunda',
        few: 'sekundy',
        many: 'sekund',
      };
      const rules = new Intl.PluralRules('pl');
      return `${time} ${strings[rules.select(time)]}`;
    },
  },
  methods: {
    startAuction() {
      this.socket.emit('start-auction');
    },
  },
};
</script>

<style lang="scss">
.auction-not-started-screen {
  max-width: 600px;
}
</style>
