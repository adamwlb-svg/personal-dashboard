"use client";

import { useMemo, useState } from "react";

type Word = {
  word: string;
  pos: string;
  def: string;
  example: string;
  tip: string;
};

const WORDS: Word[] = [
  { word: "Ebullient",      pos: "adj", def: "Cheerful and full of energy; bubbling with enthusiasm.",                        example: "Her ebullient personality made her the life of every gathering.",                 tip: "From Latin ebullire — 'to bubble up.' Think: emotions bubbling over." },
  { word: "Laconic",        pos: "adj", def: "Using very few words; brief and to the point.",                                 example: "His laconic reply — 'fine' — ended the conversation.",                          tip: "From Laconia (Sparta), whose citizens were famously terse." },
  { word: "Perfidious",     pos: "adj", def: "Deceitful and untrustworthy; guilty of betrayal.",                              example: "The perfidious advisor sold state secrets to the enemy.",                       tip: "Per (through) + fides (faith) — someone who has broken through faith." },
  { word: "Equivocate",     pos: "verb", def: "Use ambiguous language to conceal the truth or avoid commitment.",             example: "The politician equivocated when asked about the scandal.",                     tip: "Equi (equal) + vox (voice) — speaking with two equal voices at once." },
  { word: "Acrimonious",    pos: "adj", def: "Bitter and sharp in manner or speech; angry and full of ill will.",             example: "The divorce proceedings were acrimonious and exhausting.",                     tip: "From Latin acrimonia — sharpness. Think: acrid taste = bitter taste." },
  { word: "Ameliorate",     pos: "verb", def: "Make something bad or unsatisfactory better; improve.",                        example: "New policies were introduced to ameliorate conditions for workers.",              tip: "From Latin melior — 'better.' Related to 'meliorate' = improve." },
  { word: "Obfuscate",      pos: "verb", def: "Render obscure, unclear, or unintelligible; confuse deliberately.",            example: "The report was full of jargon designed to obfuscate the truth.",               tip: "Ob (over) + fuscus (dark) — to darken or cloud over something." },
  { word: "Magnanimous",    pos: "adj", def: "Very generous or forgiving, especially toward a rival or less powerful person.", example: "The champion was magnanimous in victory, praising her opponent.",              tip: "Magnus (great) + animus (soul) — literally 'great-souled.'" },
  { word: "Mendacious",     pos: "adj", def: "Not telling the truth; lying.",                                                 example: "The mendacious witness contradicted himself repeatedly.",                       tip: "From Latin mendax — liar. Memorize: 'men-DAY-shus people lie every day.'" },
  { word: "Garrulous",      pos: "adj", def: "Excessively talkative, especially about trivial matters.",                     example: "The garrulous neighbor kept them on the doorstep for an hour.",                tip: "From Latin garrire — to chatter. Think: 'gab-ulous.'" },
  { word: "Inimical",       pos: "adj", def: "Tending to obstruct or harm; unfriendly; hostile.",                            example: "Stress is inimical to good health.",                                           tip: "In (not) + amicus (friend) — the opposite of amicable." },
  { word: "Perspicacious",  pos: "adj", def: "Having a ready insight; shrewd and discerning.",                               example: "The perspicacious investor spotted the market shift early.",                    tip: "Per + spicere (to see) — to see clearly through things." },
  { word: "Excoriate",      pos: "verb", def: "Criticize someone or something harshly.",                                     example: "The review excoriated the film's lazy writing.",                               tip: "Ex + corium (hide/skin) — to flay or strip the skin. Scathing criticism." },
  { word: "Insidious",      pos: "adj", def: "Proceeding in a gradual, subtle way but with harmful effects.",                 example: "The insidious spread of misinformation eroded trust slowly.",                  tip: "From Latin insidiae — ambush. Danger lurking unseen." },
  { word: "Hubris",         pos: "noun", def: "Excessive pride or self-confidence, often leading to downfall.",               example: "His hubris in assuming he'd win cost him the election.",                       tip: "Greek concept: heroes who challenge the gods invite ruin." },
  { word: "Mercurial",      pos: "adj", def: "Subject to sudden or unpredictable changes of mood or mind.",                  example: "Her mercurial temperament made it hard to know what to expect.",               tip: "Mercury (the god/planet) = speed and changeability. Quicksilver." },
  { word: "Obsequious",     pos: "adj", def: "Obedient or attentive to an excessive degree; fawning.",                       example: "The obsequious assistant agreed with everything his boss said.",                tip: "From Latin obsequi — to comply. Think: 'ob-SEEK-ious' — seeking to please." },
  { word: "Iconoclast",     pos: "noun", def: "A person who attacks cherished beliefs or institutions.",                     example: "The iconoclast challenged centuries of scientific orthodoxy.",                  tip: "Ikon (image) + klao (break) — literally 'image-breaker.'" },
  { word: "Sycophant",      pos: "noun", def: "A person who acts obsequiously toward influential people to gain advantage.",  example: "The sycophant praised every mediocre idea the CEO suggested.",                 tip: "Greek: sukon (fig) + phainein (to show) — an ancient informer. Now: flatterer." },
  { word: "Truculent",      pos: "adj", def: "Eager or quick to argue or fight; aggressively defiant.",                      example: "The truculent defendant interrupted the judge three times.",                    tip: "From Latin truculent — fierce. Think: truck + violent = truculently aggressive." },
  { word: "Vitiate",        pos: "verb", def: "Spoil or impair the quality or efficiency of; make legally invalid.",         example: "A single error can vitiate an entire contract.",                               tip: "From Latin vitium — fault or defect. Vitiate = introduce a defect." },
  { word: "Loquacious",     pos: "adj", def: "Tending to talk a great deal; talkative.",                                    example: "The loquacious professor rarely finished a lecture on time.",                   tip: "From Latin loqui — to speak. Loquacious = speaks a LOT." },
  { word: "Recondite",      pos: "adj", def: "Not known by many people; obscure or abstruse.",                               example: "The professor delighted in recondite historical trivia.",                       tip: "Re + condere (to hide) — hidden away from common knowledge." },
  { word: "Soporific",      pos: "adj", def: "Tending to induce drowsiness or sleep; tediously boring.",                    example: "The soporific lecture had half the room nodding off.",                         tip: "Sopor (deep sleep) — soporific = sleep-inducing. Think: Sopor = snore." },
  { word: "Tendentious",    pos: "adj", def: "Promoting a particular cause or point of view; biased.",                      example: "The tendentious documentary omitted inconvenient facts.",                      tip: "Tendency + -ious. A tendentious person has a strong tendency toward a view." },
  { word: "Cogent",         pos: "adj", def: "Clear, logical, and convincing in argument.",                                  example: "She made a cogent case for restructuring the department.",                     tip: "From Latin cogere — to drive together. A cogent argument holds together well." },
  { word: "Dilatory",       pos: "adj", def: "Slow to act; intended to cause delay.",                                       example: "The dilatory tactics of his lawyers frustrated the court.",                    tip: "From Latin dilatus — deferred. Dilatory people are always delaying." },
  { word: "Impecunious",    pos: "adj", def: "Having little or no money; poor.",                                             example: "The impecunious student survived on ramen and library books.",                  tip: "Im (not) + pecunia (money) — literally 'without money.'" },
  { word: "Ignominious",    pos: "adj", def: "Deserving or causing public disgrace or shame.",                               example: "The champion suffered an ignominious defeat in the first round.",               tip: "In (not) + nomen (name/reputation) — to lose one's good name." },
  { word: "Intransigent",   pos: "adj", def: "Unwilling to change one's views or agree; stubborn.",                         example: "The intransigent negotiator refused every compromise offer.",                   tip: "In (not) + transigere (to come to terms) — refusing to reach agreement." },
  { word: "Pellucid",       pos: "adj", def: "Translucently clear; easily understood.",                                      example: "The professor's pellucid explanations made the topic accessible.",              tip: "Per (through) + lucidus (bright) — light shines right through it." },
  { word: "Calumny",        pos: "noun", def: "A false and malicious statement designed to injure someone's reputation.",    example: "He sued the newspaper for calumny after the false story ran.",                 tip: "From Latin calumnia — trickery. Related to 'challenge' (calumny in court)." },
  { word: "Enervate",       pos: "verb", def: "Weaken; cause someone to feel drained of energy.",                           example: "The relentless heat enervated the hiking team.",                               tip: "E (out) + nervus (sinew/nerve) — to take the nerves out of something." },
  { word: "Ephemeral",      pos: "adj", def: "Lasting for a very short time; transitory.",                                  example: "The ephemeral beauty of cherry blossoms draws crowds each spring.",             tip: "Greek ephemeros — lasting only a day (epi + hemera = day)." },
  { word: "Harangue",       pos: "noun/verb", def: "A lengthy, aggressive speech; to lecture at length.",                   example: "The coach harangued the team about their lackluster performance.",               tip: "From Old French harengue — a public speech. Think: ranting harangue." },
  { word: "Inveterate",     pos: "adj", def: "Having a habit or interest that is firmly established; deep-rooted.",         example: "He was an inveterate gambler who couldn't resist a wager.",                   tip: "In + vetus (old) — so old it's become deeply ingrained." },
  { word: "Malfeasance",    pos: "noun", def: "Wrongdoing, especially by a public official.",                               example: "The treasurer was dismissed for malfeasance involving company funds.",           tip: "Mal (bad) + faisance (doing) — literally 'bad doing.'" },
  { word: "Opprobrious",    pos: "adj", def: "Outrageously disgraceful; expressing scorn or criticism.",                    example: "His opprobrious remarks scandalized the audience.",                            tip: "From Latin opprobrium — disgrace, reproach. Think: 'prob' = probe into shame." },
  { word: "Pernicious",     pos: "adj", def: "Having a harmful effect, especially in a gradual way.",                       example: "The pernicious influence of propaganda is hard to reverse.",                   tip: "Per (thoroughly) + nex (death) — thoroughly deadly." },
  { word: "Querulous",      pos: "adj", def: "Complaining in a petulant or whining manner.",                                example: "The querulous patient complained about everything from the food to the nurses.", tip: "From Latin queri — to complain. Related to 'quarrel.'" },
  { word: "Surfeit",        pos: "noun", def: "Excess; an amount that is too great; a feeling of being overfull.",          example: "A surfeit of rich food left everyone uncomfortable.",                          tip: "Old French: sur (over) + faire (to do) — overdone." },
  { word: "Temerity",       pos: "noun", def: "Excessive confidence or boldness; audacity.",                                example: "She had the temerity to contradict the expert in his own field.",               tip: "From Latin temere — rashly. Temerity is reckless boldness." },
  { word: "Vacillate",      pos: "verb", def: "Waver between different opinions; be indecisive.",                           example: "He vacillated between accepting and rejecting the offer for days.",              tip: "From Latin vacillare — to sway. A vacillating person sways back and forth." },
  { word: "Zealot",         pos: "noun", def: "A person who is fanatical and uncompromising in pursuit of their ideals.",   example: "The health zealot refused to eat anything processed.",                         tip: "From Greek zelos — zeal. The Zealots were an extreme Jewish sect." },
  { word: "Abrogate",       pos: "verb", def: "Repeal or do away with a law or agreement formally.",                        example: "The new government moved to abrogate the unpopular treaty.",                  tip: "Ab (away) + rogare (to ask/propose a law) — to propose away a law." },
  { word: "Alacrity",       pos: "noun", def: "Brisk and cheerful readiness; eager willingness.",                           example: "She accepted the challenge with alacrity, ready to begin immediately.",         tip: "From Latin alacer — lively. Alacrity = eager liveliness." },
  { word: "Anachronism",    pos: "noun", def: "Something out of its proper time period; a chronological inconsistency.",    example: "A smartphone in a medieval film is an anachronism.",                          tip: "Ana (against) + chronos (time) — against its proper time." },
  { word: "Apposite",       pos: "adj", def: "Appropriate or pertinent to a particular situation.",                         example: "Her apposite quotation perfectly captured the team's challenge.",               tip: "From Latin appositus — placed near. Apposite = placed right where needed." },
  { word: "Auspicious",     pos: "adj", def: "Promising success; favorable; giving good reason for hope.",                  example: "The early results were an auspicious sign for the new venture.",                tip: "From Latin auspex — bird-observer (Roman omens). Good birds = good signs." },
  { word: "Capricious",     pos: "adj", def: "Given to sudden and unaccountable changes of mood; unpredictable.",           example: "The capricious weather ruined their outdoor wedding plans.",                    tip: "From Italian capriccio — a sudden shiver. Capra = goat (skittish)." },
  { word: "Circumlocution", pos: "noun", def: "The use of many words where fewer would do; evasive talk.",                  example: "After five minutes of circumlocution, he still hadn't answered the question.",  tip: "Circum (around) + loqui (to speak) — talking around the point." },
  { word: "Consternation",  pos: "noun", def: "Anxiety or dismay, typically at something unexpected.",                      example: "The announcement was met with consternation by the shareholders.",               tip: "From Latin consternare — to terrify. To be filled with alarm." },
  { word: "Cupidity",       pos: "noun", def: "Greed for money or possessions.",                                            example: "His cupidity drove him to embezzle from his own charity.",                     tip: "From Cupid — desire. Cupidity = excessive desire for things." },
  { word: "Desiccate",      pos: "verb", def: "Remove moisture from; cause to become dry; drain of vitality.",              example: "The desert sun desiccated the carcass within days.",                           tip: "De + siccus (dry) — to dry out completely." },
  { word: "Dissonance",     pos: "noun", def: "Lack of harmony; conflict between beliefs and actions.",                     example: "She felt cognitive dissonance trying to justify her choices.",                  tip: "Dis (apart) + sonare (sound) — sounds that clash, or ideas that clash." },
  { word: "Egregious",      pos: "adj", def: "Outstandingly bad; shocking.",                                               example: "The egregious error cost the company millions.",                               tip: "E (out of) + grex (flock) — so bad it stands out from the herd." },
  { word: "Encomium",       pos: "noun", def: "A speech or piece of writing that praises someone or something.",            example: "The retiring teacher received an encomium from former students.",                tip: "Greek enkomion — a song of praise sung at a celebration." },
  { word: "Equanimity",     pos: "noun", def: "Mental calmness, especially in difficult situations.",                       example: "She accepted the bad news with remarkable equanimity.",                        tip: "Equi (equal) + animus (mind) — an even, balanced mind." },
  { word: "Eschew",         pos: "verb", def: "Deliberately avoid using; abstain from.",                                   example: "He eschewed social media, preferring real-world connections.",                  tip: "From Old French eschiver — to shun. Deliberately shunning something." },
  { word: "Fastidious",     pos: "adj", def: "Very attentive to accuracy and detail; difficult to please.",                 example: "The fastidious editor caught every misplaced comma.",                          tip: "From Latin fastidium — aversion/disgust. Very particular about standards." },
  { word: "Felicitous",     pos: "adj", def: "Well chosen for the occasion; pleasing and fortunate.",                      example: "A felicitous phrase at the right moment can change minds.",                    tip: "From Latin felix — happy/lucky. Felicitous = happily apt." },
  { word: "Fervid",         pos: "adj", def: "Intensely enthusiastic or passionate.",                                       example: "She was a fervid supporter of criminal justice reform.",                       tip: "From Latin fervere — to boil. Fervid passion = boiling intensity." },
  { word: "Gainsay",        pos: "verb", def: "Deny or contradict; speak against.",                                        example: "Nobody could gainsay the evidence presented at trial.",                        tip: "Old English: gean (against) + secgan (say) — to say against." },
  { word: "Grandiloquent",  pos: "adj", def: "Pompous or extravagant in language or style.",                               example: "His grandiloquent speech impressed no one with its empty rhetoric.",             tip: "Grandis (great) + loqui (to speak) — speaking in an inflated, grand way." },
  { word: "Immutable",      pos: "adj", def: "Unchanging over time; unable to be changed.",                                 example: "Some physical laws appear immutable across the universe.",                     tip: "Im (not) + mutare (to change) — cannot be mutated or changed." },
  { word: "Impugn",         pos: "verb", def: "Dispute the truth, validity, or honesty of; call into question.",            example: "The lawyer sought to impugn the credibility of the witness.",                  tip: "Im (against) + pugnare (to fight) — to fight against someone's credibility." },
  { word: "Inchoate",       pos: "adj", def: "Just begun and not fully formed; undeveloped.",                               example: "The plan was still inchoate — little more than a rough idea.",                  tip: "From Latin incohare — to begin. Inchoate = just started, not yet complete." },
  { word: "Inculcate",      pos: "verb", def: "Instill an attitude or habit by repetition.",                                example: "Good teachers inculcate curiosity, not just facts.",                           tip: "In + calcare (to tread/stamp) — to stamp an idea into someone through repetition." },
  { word: "Ineffable",      pos: "adj", def: "Too great or extreme to be expressed in words.",                              example: "The view from the summit was ineffable — no photo could capture it.",           tip: "In (not) + effari (to utter) — cannot be spoken or expressed." },
  { word: "Ingenuous",      pos: "adj", def: "Innocent and unsuspecting; artlessly frank.",                                 example: "Her ingenuous smile made it hard to believe she was manipulating him.",         tip: "In + genu (native, free-born) — openly trusting, like a child. Opposite: disingenuous." },
  { word: "Inimitable",     pos: "adj", def: "So good or unusual as to be impossible to copy.",                             example: "Her inimitable style influenced a generation of designers.",                    tip: "In (not) + imitari (to imitate) — cannot be imitated." },
  { word: "Intrepid",       pos: "adj", def: "Fearless; adventurous.",                                                     example: "The intrepid explorer ventured where no one had gone before.",                 tip: "In (not) + trepidus (alarmed) — not alarmed. Calmly fearless." },
  { word: "Invective",      pos: "noun", def: "Insulting, abusive, or highly critical language.",                           example: "The editorial was full of political invective.",                               tip: "From Latin invehere — to attack. Invective = verbal attack." },
  { word: "Irascible",      pos: "adj", def: "Having or showing a tendency to be easily angered.",                         example: "The irascible coach threw a water bottle across the court.",                    tip: "From Latin irasci — to be angry. Related to 'ire' = anger." },
  { word: "Lachrymose",     pos: "adj", def: "Tearful or given to weeping; sad.",                                          example: "The lachrymose film had the entire audience reaching for tissues.",             tip: "From Latin lacrima — tear. Lachrymose = tear-filled." },
  { word: "Lugubrious",     pos: "adj", def: "Looking or sounding sad and dismal.",                                        example: "His lugubrious expression suggested the news was not good.",                   tip: "From Latin lugere — to mourn. Lugubrious = mournful in an almost comical way." },
  { word: "Malediction",    pos: "noun", def: "A curse; calling down evil upon someone.",                                   example: "The villain uttered a malediction as he fled.",                                tip: "Male (bad) + dicere (to say) — to say bad things over someone. Opposite: benediction." },
  { word: "Malleable",      pos: "adj", def: "Easily influenced; capable of being shaped.",                                 example: "Young minds are malleable — what we teach them matters.",                      tip: "From Latin malleus — hammer. Malleable = can be hammered into new shapes." },
  { word: "Mitigate",       pos: "verb", def: "Make less severe, serious, or painful.",                                    example: "Medication can mitigate but not eliminate chronic pain.",                      tip: "From Latin mitis (mild) + agere (to act) — to act to make mild." },
  { word: "Mordant",        pos: "adj", def: "Sharply critical; biting; sarcastic.",                                       example: "His mordant wit could reduce colleagues to embarrassed silence.",               tip: "From Latin mordere — to bite. Mordant humor bites." },
  { word: "Munificent",     pos: "adj", def: "Very generous; lavish.",                                                     example: "The munificent donor funded an entire new wing of the hospital.",               tip: "Munus (gift) + facere (to make) — one who makes gifts liberally." },
  { word: "Nefarious",      pos: "adj", def: "Wicked and criminal; extremely immoral.",                                    example: "The villain's nefarious plan was finally exposed.",                            tip: "Ne (not) + fas (divine law) — against divine law. Thoroughly wicked." },
  { word: "Obdurate",       pos: "adj", def: "Stubbornly refusing to change; hardened.",                                   example: "He remained obdurate in the face of compelling evidence.",                     tip: "Ob + durare (to harden) — hardened against persuasion." },
  { word: "Opaque",         pos: "adj", def: "Not transparent; hard to understand; impenetrable.",                         example: "The contract's opaque language confused even the lawyers.",                    tip: "Latin opacus — dark, shaded. Opaque = no light (or meaning) gets through." },
  { word: "Ostentatious",   pos: "adj", def: "Characterized by pretentious or showy display.",                             example: "His ostentatious mansion was designed purely to impress.",                     tip: "Ostendere (to show) — showing off excessively." },
  { word: "Palliate",       pos: "verb", def: "Make less severe without removing the cause; alleviate.",                   example: "The drug only palliates symptoms without curing the disease.",                  tip: "From Latin palliare — to cloak. Covering up a problem, not solving it." },
  { word: "Pariah",         pos: "noun", def: "An outcast; a person rejected by society.",                                  example: "After the scandal, he became a social pariah.",                                tip: "From Tamil paraiyan — drummer caste. Those who beat the ceremonial drum were untouchable." },
  { word: "Penury",         pos: "noun", def: "Extreme poverty; a scarcity of money.",                                     example: "Despite penury, she managed to send her children to school.",                  tip: "From Latin penuria — want, scarcity. Penury = want of money." },
  { word: "Phlegmatic",     pos: "adj", def: "Having a calm, stoic temperament; unemotional.",                             example: "The phlegmatic manager handled the crisis without raising his voice.",           tip: "From phlegm (one of four humors) — too much phlegm = calm, slow, unemotional." },
  { word: "Placate",        pos: "verb", def: "Make someone less angry or hostile; appease.",                               example: "She offered a sincere apology to placate the frustrated customer.",             tip: "From Latin placare — to calm. Related to 'placid.'" },
  { word: "Prevaricate",    pos: "verb", def: "Speak or act evasively; avoid committing to the truth.",                    example: "Stop prevaricating and tell me exactly what happened.",                        tip: "Pre + varicare (to straddle) — straddling the truth, going to either side of it." },
  { word: "Probity",        pos: "noun", def: "The quality of having strong moral principles; honesty.",                   example: "Her probity in financial matters earned universal trust.",                     tip: "From Latin probus — good, upright. Probity = proven uprightness." },
  { word: "Profligate",     pos: "adj", def: "Recklessly extravagant or wasteful; licentious.",                            example: "His profligate spending left him bankrupt within a year.",                     tip: "Pro + fligare (to strike down) — struck down by excess. Reckless waste." },
  { word: "Propitious",     pos: "adj", def: "Giving or indicating a good chance of success; favorable.",                  example: "Calm seas made for propitious sailing conditions.",                            tip: "From Latin propitius — favorable. The gods were propitious when they smiled on you." },
  { word: "Proselytize",    pos: "verb", def: "Convert or attempt to convert someone to a faith or belief.",               example: "She proselytized for veganism at every dinner party.",                         tip: "From Greek proselutos — newcomer. Converting others to make them newcomers to your view." },
  { word: "Recalcitrant",   pos: "adj", def: "Having an obstinately uncooperative attitude toward authority.",             example: "The recalcitrant student refused to follow any classroom rules.",                tip: "Re + calcitrare (to kick) — kicking back against authority." },
  { word: "Refractory",     pos: "adj", def: "Stubborn or unmanageable; resistant to treatment.",                          example: "The refractory patient refused all proposed treatments.",                      tip: "Re + frangere (to break) — something that can't be broken down or controlled." },
  { word: "Repudiate",      pos: "verb", def: "Refuse to accept; reject; disown.",                                         example: "She publicly repudiated her earlier statements.",                              tip: "From Latin repudiare — to divorce. Repudiate = cast off entirely." },
  { word: "Sagacious",      pos: "adj", def: "Having or showing keen mental discernment; wise.",                           example: "The sagacious mentor guided her through every difficult decision.",              tip: "From Latin sagax — keen. Sagacious people are mentally keen and wise." },
  { word: "Sanguine",       pos: "adj", def: "Optimistic, especially in a difficult situation.",                           example: "He remained sanguine about the company's future despite the losses.",           tip: "From Latin sanguis — blood. Ruddy-cheeked = full of life = optimistic." },
  { word: "Sardonic",       pos: "adj", def: "Grimly mocking; disdainfully humorous.",                                     example: "Her sardonic smile said she wasn't surprised by the failure.",                  tip: "From Sardinia — a plant there supposedly caused death-grimace. Bitter humor." },
  { word: "Sedulous",       pos: "adj", def: "Showing dedication and great diligence.",                                    example: "Her sedulous preparation paid off when she aced the exam.",                    tip: "From Latin sedulus — zealous. Sedulous = carefully, persistently hardworking." },
  { word: "Solicitous",     pos: "adj", def: "Showing great care and concern; anxious.",                                   example: "The solicitous nurse checked on her patient every hour.",                      tip: "From Latin sollicitus — anxious. Solicitous concern = worrying attentiveness." },
  { word: "Specious",       pos: "adj", def: "Superficially plausible but actually wrong or misleading.",                  example: "The argument sounded convincing but was entirely specious.",                   tip: "From Latin speciosus — good-looking. Looks good but isn't. Beautiful deception." },
  { word: "Spurious",       pos: "adj", def: "Not genuine; false; of doubtful authenticity.",                              example: "The spurious document was quickly identified as a forgery.",                   tip: "From Latin spurius — illegitimate. Spurious = illegitimate or fake." },
  { word: "Stolid",         pos: "adj", def: "Calm; dependable; not easily excited or upset.",                             example: "The stolid detective listened to the frantic story without expression.",         tip: "From Latin stolidus — dull, firm. Stolid = solid and unmoved emotionally." },
  { word: "Strident",       pos: "adj", def: "Loud, harsh, and unpleasant; presenting views in an excessively forceful way.", example: "Her strident demands alienated potential allies.",                          tip: "From Latin stridere — to creak/hiss. Strident = harsh, grating loudness." },
  { word: "Supplant",       pos: "verb", def: "Supersede and replace; take the place of.",                                 example: "Streaming services have supplanted traditional TV for many viewers.",           tip: "Sub (under) + planta (sole of foot) — to trip someone up and take their place." },
  { word: "Surreptitious",  pos: "adj", def: "Kept secret, especially because it would not be approved of.",               example: "He cast a surreptitious glance at his neighbor's test.",                       tip: "Sub (under) + rapere (to seize) — seized from under. Sneaky, stolen." },
  { word: "Timorous",       pos: "adj", def: "Easily frightened; nervous or timid.",                                       example: "The timorous student barely whispered her answer.",                            tip: "From Latin timor — fear. Timorous = full of fear." },
  { word: "Toady",          pos: "noun/verb", def: "A person who flatters and defers to those in power; to fawn.",         example: "He was such a toady that he laughed at every joke the boss made.",              tip: "From 'toad-eater' — a charlatan's assistant who ate toads to show the master could cure them." },
  { word: "Torpid",         pos: "adj", def: "Mentally or physically inactive; lethargic.",                               example: "The torpid patient barely responded to questions.",                            tip: "From Latin torpere — to be numb. Torpid = numb with inactivity." },
  { word: "Transient",      pos: "adj", def: "Lasting only for a short time; temporary.",                                  example: "Fame proved transient — the star was forgotten within a decade.",               tip: "From Latin transire — to go across. Transient = just passing through." },
  { word: "Treacly",        pos: "adj", def: "Excessively sweet or sentimental; cloying.",                                 example: "The treacly love song made the critics cringe.",                               tip: "From treacle (syrup) — so sweet it sticks and overwhelms." },
  { word: "Turpitude",      pos: "noun", def: "Wickedness; depravity.",                                                    example: "The charges alleged moral turpitude unfitting of a public official.",          tip: "From Latin turpis — vile, base. Turpitude = the state of being vile." },
  { word: "Unctuous",       pos: "adj", def: "Excessively flattering; insincerely smooth or suave.",                      example: "His unctuous compliments felt hollow and manipulative.",                       tip: "From Latin ungere — to anoint with oil. Unctuous = oily-smooth insincerity." },
  { word: "Venal",          pos: "adj", def: "Susceptible to bribery; corrupt.",                                           example: "The venal official accepted payments in exchange for permits.",                 tip: "From Latin venalis — for sale. Venal = up for sale to the highest bidder." },
  { word: "Vex",            pos: "verb", def: "Make someone feel annoyed or puzzled.",                                     example: "The persistent technical glitch vexed the entire engineering team.",             tip: "From Latin vexare — to shake, agitate. Vex = shake someone's composure." },
  { word: "Vociferous",     pos: "adj", def: "Expressing opinions in a loud and forceful way.",                            example: "Vociferous protesters gathered outside the courthouse.",                       tip: "Vox (voice) + ferre (to carry) — carrying one's voice loudly everywhere." },
  { word: "Wanton",         pos: "adj", def: "Deliberate and unprovoked; recklessly self-indulgent.",                     example: "The wanton destruction of art was condemned worldwide.",                       tip: "Old English wantoun — undisciplined. Wanton = unrestrained, without discipline." },
  { word: "Xenophobia",     pos: "noun", def: "Dislike or fear of people from other countries.",                           example: "Xenophobia rose as economic anxiety spread through the region.",                tip: "Xenos (stranger) + phobos (fear) — fear of strangers or foreigners." },
];

// Stable shuffle using a numeric seed (date-based)
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = Math.imul(s ^ (s >>> 17), 0x45d9f3b);
    s = Math.imul(s ^ (s >>> 13), 0x1b873593);
    s ^= s >>> 16;
    const j = (s >>> 0) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getDailyWords(): Word[] {
  const d = new Date();
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  return seededShuffle(WORDS, seed).slice(0, 3);
}

const CARD_THEMES = [
  { accent: "#818cf8", bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.25)", badge: "rgba(99,102,241,0.18)", label: "indigo" },
  { accent: "#34d399", bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.25)", badge: "rgba(52,211,153,0.18)", label: "emerald" },
  { accent: "#fb923c", bg: "rgba(251,146,60,0.08)",  border: "rgba(251,146,60,0.25)",  badge: "rgba(251,146,60,0.18)",  label: "orange" },
];

function WordCard({ word, theme, index }: { word: Word; theme: typeof CARD_THEMES[0]; index: number }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      onClick={() => setFlipped(f => !f)}
      className="relative cursor-pointer rounded-2xl border p-5 flex flex-col gap-3 transition-all hover:scale-[1.01] select-none"
      style={{ background: theme.bg, borderColor: theme.border }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: theme.badge, color: theme.accent }}
          >
            {word.pos}
          </span>
          <span className="text-xs text-fg-3">Word {index + 1}</span>
        </div>
        <span className="text-lg" title={flipped ? "show word" : "show tip"}>
          {flipped ? "💡" : "📖"}
        </span>
      </div>

      {/* Word */}
      <div>
        <h3
          className="text-2xl font-bold tracking-tight leading-none"
          style={{ color: theme.accent }}
        >
          {word.word}
        </h3>
      </div>

      {/* Body — flips between definition view and tip view */}
      <div className="flex-1 space-y-2.5 min-h-[80px]">
        {!flipped ? (
          <>
            <p className="text-sm text-fg leading-relaxed">{word.def}</p>
            <p className="text-xs text-fg-3 italic leading-relaxed border-l-2 pl-2.5" style={{ borderColor: theme.accent }}>
              &ldquo;{word.example}&rdquo;
            </p>
          </>
        ) : (
          <div className="flex gap-2.5">
            <span className="text-base flex-shrink-0 mt-0.5">💡</span>
            <p className="text-sm text-fg-2 leading-relaxed">{word.tip}</p>
          </div>
        )}
      </div>

      {/* Tap hint */}
      <p className="text-xs text-fg-4 text-right">
        {flipped ? "Tap to see definition" : "Tap for memory tip"}
      </p>
    </div>
  );
}

export function GREWords() {
  const words = useMemo(() => getDailyWords(), []);
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-fg flex items-center gap-2">
          <span>🎓</span> GRE Words of the Day
        </h2>
        <span className="text-xs text-fg-3">{today} · new words tomorrow</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {words.map((word, i) => (
          <WordCard key={word.word} word={word} theme={CARD_THEMES[i]} index={i} />
        ))}
      </div>
    </div>
  );
}
