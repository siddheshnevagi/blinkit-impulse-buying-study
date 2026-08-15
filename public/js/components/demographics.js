import { el, stepShell, pillGroup } from '../ui.js';

const AGE_GROUPS = ['18–24', '25–34', '35–44', '45+'];
const GENDERS = ['Female', 'Male', 'Prefer to self-describe / not say'];
const OCCUPATIONS = ['Student', 'Working professional', 'Self-employed', 'Homemaker', 'Other'];

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
    field('Occupation', null, OCCUPATIONS, 'occupation'),
  ]);

  const { node, refreshDisabled } = stepShell({
    eyebrow: 'Part 1 of 11',
    title: 'A little about yourself',
    lede: 'This helps us understand how impulse buying differs across groups — nothing here identifies you personally.',
    body,
    onBack: ctx.goBack,
    onNext: async () => {
      await ctx.api.saveProfile(ctx.state.uuid, d);
      ctx.goNext();
    },
    nextDisabled: () => !(d.ageGroup && d.gender && d.occupation),
  });
  container.appendChild(node);
}
