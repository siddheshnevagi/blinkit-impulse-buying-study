import { el, stepShell, pillGroup } from '../ui.js';

const AGE_GROUPS = ['18–24', '25–34', '35–44', '45+'];
const GENDERS = ['Female', 'Male', 'Prefer to self-describe / not say'];
const CITY_TYPES = ['Metro', 'Tier-1', 'Tier-2', 'Tier-3 / other'];
const OCCUPATIONS = ['Student', 'Working professional', 'Self-employed', 'Homemaker', 'Other'];
const INCOME_BANDS = ['< ₹10k', '₹10k–25k', '₹25k–50k', '₹50k–1L', '> ₹1L'];

export default function renderDemographics(container, ctx) {
  const d = ctx.state.profile;

  function field(label, sub, options, key) {
    return el('div', { class: 'field' }, [
      el('label', { class: 'field__label' }, label),
      sub ? el('div', { class: 'field__sub' }, sub) : null,
      pillGroup({ options, value: () => d[key], onChange: (v) => { d[key] = v; refreshDisabled(); } }),
    ]);
  }

  const body = el('div', {}, [
    field('Age group', null, AGE_GROUPS, 'ageGroup'),
    field('Gender', null, GENDERS, 'gender'),
    field('Where do you live?', null, CITY_TYPES, 'cityType'),
    field('Occupation', null, OCCUPATIONS, 'occupation'),
    field('Monthly personal spending money / income', 'A rough band is fine.', INCOME_BANDS, 'incomeBand'),
  ]);

  const { node, refreshDisabled } = stepShell({
    eyebrow: 'Part 1 of 12',
    title: 'A little about yourself',
    lede: 'This helps us understand how impulse buying differs across groups — nothing here identifies you personally.',
    body,
    onBack: ctx.goBack,
    onNext: async () => {
      await ctx.api.saveProfile(ctx.state.uuid, d);
      ctx.goNext();
    },
    nextDisabled: () => !(d.ageGroup && d.gender && d.cityType && d.occupation && d.incomeBand),
  });
  container.appendChild(node);
}
