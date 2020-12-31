<template>
  <v-card outlined max-width="600">
    <v-card-title>
      Aukcja angielska
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
          label="Cena wywoławcza"
          v-model="startingPriceInput"
          type="number"
          filled
          min="0"
          :error-messages="startingPriceError"
          :step="parseInt(multiplierInput) || 1"
        />
        <v-text-field
          label="Kwota postąpienia"
          v-model="minIncrementInput"
          type="number"
          filled
          min="0"
          :error-messages="minIncrementError"
          :step="parseInt(multiplierInput) || 1"
        />
        <v-slider label="Czas" thumb-label min="3" max="120" v-model="timePerBidInput" step="1">
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
      startingPriceInput: '1',
      minIncrementInput: '5',
      timePerBidInput: 5,
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
    startingPriceError() {
      if (this.startingPriceInput === '') return 'Cena wywoławcza jest wymagana';
      const startingPrice = parseFloat(this.startingPriceInput);
      if (_.isNaN(startingPrice)) return 'Niepoprawna liczba';
      if (startingPrice <= 0) return 'Cena wywoławcza musi być dodatnia';
      if (
        this.multiplierError === null
        && startingPrice % parseFloat(this.multiplierInput) !== 0
      ) return 'Cena wywoławcza musi być wieloktonością mnożnika';
      return null;
    },
    minIncrementError() {
      if (this.minIncrementInput === '') return 'Kwota postąpienia jest wymagana';
      const minIncrement = parseFloat(this.minIncrementInput);
      if (_.isNaN(minIncrement)) return 'Niepoprawna liczba';
      if (minIncrement <= 0) return 'Kwota postąpienia musi być dodatnia';
      if (
        this.multiplierError === null
        && minIncrement % parseFloat(this.multiplierInput) !== 0
      ) return 'Kwota postąpienia musi być wieloktonością mnożnika';
      return null;
    },
  },
  methods: {
    async submit() {
      if (this.loading || !this.formValid) return;
      this.loading = true;
      try {
        const auctionOptions = {
          type: 'british',
          currency: this.currencyInput.trim(),
          multiplier: parseFloat(this.multiplierInput),
          startingPrice: parseFloat(this.startingPriceInput),
          minIncrement: parseFloat(this.minIncrementInput),
          timePerBid: this.timePerBidInput * 1000,
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
        localStorage.setItem('room', JSON.stringify({
          roomId: body.roomId,
          playerId: body.playerId,
          token: body.roomToken,
        }));
        localStorage.setItem('last-british-options', JSON.stringify(auctionOptions));
        await this.$router.replace('/auction');
      } catch (error) {
        console.error(error);
        // TODO: Add error handling
      }
      this.loading = false;
    },
  },
  created() {
    const auctionOptionsString = localStorage.getItem('last-british-options');
    if (auctionOptionsString !== null) {
      const auctionOptions = JSON.parse(auctionOptionsString);
      this.currencyInput = auctionOptions.currency;
      this.multiplierInput = auctionOptions.multiplier.toString();
      this.startingPriceInput = auctionOptions.startingPrice.toString();
      this.minIncrementInput = auctionOptions.minIncrement.toString();
      this.timePerBidInput = auctionOptions.timePerBid / 1000;
    }
  },
};
</script>
