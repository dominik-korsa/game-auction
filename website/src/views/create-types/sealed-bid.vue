<template>
  <v-card outlined max-width="600">
    <v-card-title>
      Aukcja w ciemno
      <v-spacer />
      <v-btn text color="primary" to="/create" exact>Zmień</v-btn>
    </v-card-title>
    <v-divider />
    <v-form v-model="formValid" @submit.prevent="submit">
      <v-card-text class="pb-0">
        <v-text-field label="Symbol waluty" filled v-model="currencyInput">
          <template #append-outer>
            <div class="d-flex">
              <v-chip
                v-for="(curr, i) in defaultCurrencies"
                :key="curr"
                :class="{
                  'ml-1': i !== 0
                }"
                :input-value="currencyInput === curr"
                @click="currencyInput = curr"
                color="grey darken-2"
              >
                {{ curr }}
              </v-chip>
            </div>
          </template>
        </v-text-field>
        <v-text-field
          label="Mnożnik"
          v-model="multiplierInput"
          type="number"
          filled
          min="0"
          :error-messages="multiplierError"
        />
        <v-text-field
          label="Cena minimalna"
          v-model="minPriceInput"
          type="number"
          filled
          min="0"
          :error-messages="minPriceError"
          :step="parseInt(multiplierInput) || 1"
        />
        <v-radio-group
          v-model="secondPriceMode"
          label="Cena dla nabywcy"
          class="mt-0 pt-0"
          mandatory
        >
          <v-radio :value="false" label="Najwyższa (swoja) oferta" />
          <v-radio :value="true" label="Druga najwyższa oferta" />
        </v-radio-group>
        <v-slider
          label="Łączny czas"
          thumb-label
          min="10"
          max="600"
          v-model="totalTimeInput"
          step="10"
        >
          <template #thumb-label="{ value }">
            {{ value }}s
          </template>
        </v-slider>
      </v-card-text>
      <v-card-actions>
        <v-spacer/>
        <v-btn
          color="primary"
          type="submit"
          :disabled="!formValid"
          :loading="loading"
        >
          Utwórz
        </v-btn>
      </v-card-actions>
    </v-form>
  </v-card>
</template>

<script>
import _ from 'lodash';

export default {
  data() {
    return {
      formValid: null,
      defaultCurrencies: ['€', '$', '£', '₿'],
      currencyInput: '€',
      multiplierInput: '1',
      minPriceInput: '1',
      totalTimeInput: 20,
      secondPriceMode: false,
      loading: false,
    };
  },
  computed: {
    multiplierError() {
      if (this.multiplierInput === '') return 'Mnożnik jest wymagany';
      const multiplier = parseFloat(this.multiplierInput);
      if (_.isNaN(multiplier)) return 'Niepoprawna liczba';
      if (multiplier <= 0) return 'Mnożnik musi być dodatni';
      return null;
    },
    minPriceError() {
      if (this.minPriceInput === '') return 'Cena początkowa jest wymagana';
      const startingPrice = parseFloat(this.minPriceInput);
      if (_.isNaN(startingPrice)) return 'Niepoprawna liczba';
      if (startingPrice <= 0) return 'Cena początkowa musi być dodatnia';
      if (
        this.multiplierError === null
        && startingPrice % parseFloat(this.multiplierInput) !== 0
      ) return 'Cena początkowa musi być wielokrotnością mnożnika';
      return null;
    },
  },
  methods: {
    async submit() {
      if (this.loading || !this.formValid) return;
      this.loading = true;
      try {
        const auctionOptions = {
          type: 'sealed-bid',
          currency: this.currencyInput.trim(),
          multiplier: parseFloat(this.multiplierInput),
          minPrice: parseFloat(this.minPriceInput),
          secondPriceMode: this.secondPriceMode,
          totalTime: this.totalTimeInput * 1000,
        };

        await new Promise((resolve) => setTimeout(resolve, _.random(200, 800)));
        const response = await fetch(
          new URL('/api/create-room', this.$app.serverHost),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              auctionOptions,
            }),
          },
        );
        const body = await response.json();
        sessionStorage.setItem('room', JSON.stringify({
          roomId: body.roomId,
          playerId: body.playerId,
          token: body.roomToken,
        }));
        localStorage.setItem('last-sealed-bid-options', JSON.stringify(auctionOptions));
        await this.$router.replace('/auction');
      } catch (error) {
        console.error(error);
        // TODO: Add error handling
      }
      this.loading = false;
    },
  },
  created() {
    const auctionOptionsString = localStorage.getItem('last-sealed-bid-options');
    if (auctionOptionsString !== null) {
      const auctionOptions = JSON.parse(auctionOptionsString);
      this.currencyInput = auctionOptions.currency;
      this.multiplierInput = auctionOptions.multiplier.toString();
      this.minPriceInput = auctionOptions.minPrice.toString();
      this.secondPriceMode = auctionOptions.secondPriceMode;
      this.totalTimeInput = auctionOptions.totalTime / 1000;
    }
  },
};
</script>
