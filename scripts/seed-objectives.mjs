#!/usr/bin/env node
/**
 * Seeds curriculum_objectives with syllabus content for core qualifications.
 * Sourced from official AQA, OCR, and Pearson specification documents.
 *
 * Usage: node scripts/seed-objectives.mjs
 */
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

try {
  const envFile = readFileSync(".env.local", "utf-8");
  for (const line of envFile.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
} catch {}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Curriculum objectives by QAN ───────────────────────────────────────
// Sourced from official awarding body specification documents

const OBJECTIVES = [
  // ────────────────────────────────────────────────────────────────────
  // AQA GCSE Mathematics (9-1) — 60146084
  // Spec: AQA 8300
  // ────────────────────────────────────────────────────────────────────
  { qan: "60146084", topic: "Number", objectives: [
    "Order positive and negative integers, decimals and fractions; use the symbols =, ≠, <, >, ≤, ≥",
    "Apply the four operations to integers, decimals, simple fractions and mixed numbers",
    "Understand and use place value for decimals, measures and integers of any size",
    "Use the concepts and vocabulary of prime numbers, factors, multiples, common factors, common multiples, HCF, LCM, prime factorisation including using product notation and the unique factorisation theorem",
    "Apply systematic listing strategies including use of the product rule for counting",
    "Use positive integer powers and associated real roots; recognise powers of 2, 3, 4, 5 and distinguish between exact representations of roots and their decimal approximations",
    "Calculate with roots and with integer and fractional indices",
    "Calculate exactly with fractions, surds and multiples of π",
    "Calculate with and interpret standard form A × 10ⁿ, where 1 ≤ A < 10 and n is an integer",
    "Work interchangeably with terminating decimals and their corresponding fractions",
    "Identify and work with fractions in ratio problems",
    "Apply and interpret limits of accuracy including upper and lower bounds",
  ]},
  { qan: "60146084", topic: "Algebra", objectives: [
    "Use and interpret algebraic notation, including ab, 3y, a², a³, a/b, coefficients and terms",
    "Substitute numerical values into formulae and expressions, including scientific formulae",
    "Understand and use the concepts and vocabulary of expressions, equations, inequalities, terms and factors",
    "Simplify and manipulate algebraic expressions by collecting like terms, multiplying a single term over a bracket, taking out common factors, expanding products of two or more binomials",
    "Understand and use standard mathematical formulae; rearrange formulae to change the subject",
    "Work with coordinates in all four quadrants",
    "Recognise, sketch and interpret graphs of linear functions, quadratic functions, simple cubic functions, the reciprocal function y = 1/x",
    "Plot and interpret graphs of kinematic problems involving distance, speed, acceleration",
    "Solve linear equations in one unknown algebraically including those with fractional terms",
    "Solve quadratic equations algebraically by factorising, completing the square, using the formula; find approximate solutions using a graph",
    "Solve two simultaneous equations in two variables (linear/linear and linear/quadratic) algebraically; find approximate solutions using a graph",
    "Solve linear inequalities in one or two variables; represent the solution set on a number line or graph",
    "Recognise arithmetic and geometric sequences; find the nth term of linear and quadratic sequences",
    "Generate terms of a sequence from a term-to-term rule or a position-to-term rule",
  ]},
  { qan: "60146084", topic: "Ratio, proportion and rates of change", objectives: [
    "Change freely between related standard units and compound units in numerical and algebraic contexts",
    "Use scale factors, scale diagrams and maps",
    "Express one quantity as a fraction of another; use ratio notation; divide a quantity in a given ratio",
    "Use compound units such as speed, unit pricing, density, pressure and rates of pay",
    "Compare lengths, areas and volumes using ratio notation and/or scale factors",
    "Understand and use proportion as equality of ratios",
    "Relate the language of ratios and fractions and the associated calculations",
    "Solve problems involving direct and inverse proportion, including graphical and algebraic representations",
    "Interpret the gradient of a straight-line graph as a rate of change",
    "Set up, solve and interpret the answers in growth and decay problems including compound interest",
    "Interpret fractions and percentages as operators; find percentage change and reverse percentages",
  ]},
  { qan: "60146084", topic: "Geometry and measures", objectives: [
    "Use conventional terms and notations: points, lines, vertices, edges, planes, parallel, perpendicular, right angles, polygons, regular and irregular, congruence and similarity",
    "Use the standard ruler and compass constructions; use these to construct given figures and solve loci problems",
    "Apply the properties of angles at a point, on a straight line, vertically opposite, alternate, corresponding, co-interior; derive and use the sum of angles in a triangle and quadrilateral",
    "Derive and apply the properties and definitions of special types of quadrilaterals and triangles",
    "Use Pythagoras' Theorem and trigonometric ratios in 2D and 3D problems",
    "Use the sine rule, cosine rule and area = ½ab sin C to solve problems in 2D",
    "Know the exact values of sin and cos for 0°, 30°, 45°, 60°, 90° and tan for 0°, 30°, 45°, 60°",
    "Describe translations as 2D column vectors; apply addition and subtraction of vectors and multiplication by a scalar",
    "Identify, describe and construct congruent and similar shapes including on coordinate axes",
    "Know and apply formulae to calculate: area of triangles, parallelograms, trapezia; volume of cuboids, prisms, cylinders, cones, spheres, pyramids; surface area of these shapes",
    "Calculate arc lengths, angles and areas of sectors of circles",
    "Apply the concepts of congruence and similarity in calculations involving areas and volumes",
  ]},
  { qan: "60146084", topic: "Probability", objectives: [
    "Record, describe and analyse the frequency of outcomes of probability experiments using tables and frequency trees",
    "Apply ideas of randomness, fairness and equally likely events to calculate expected outcomes",
    "Relate relative expected frequencies to theoretical probability",
    "Apply the property that the probabilities of an exhaustive set of mutually exclusive events sum to one",
    "Enumerate sets and combinations of sets systematically using Venn diagrams, tables, grids and tree diagrams",
    "Construct theoretical possibility spaces for single and combined experiments",
    "Calculate and interpret conditional probabilities through Venn diagrams, two-way tables and tree diagrams",
  ]},
  { qan: "60146084", topic: "Statistics", objectives: [
    "Infer properties of populations from a sample while knowing the limitations of sampling",
    "Interpret and construct tables, charts and diagrams for grouped discrete and continuous data",
    "Construct and interpret scatter diagrams; recognise correlation; draw and use a line of best fit",
    "Interpret, analyse and compare distributions through appropriate measures of central tendency and spread",
    "Apply statistics to describe a population; use and interpret quartiles and inter-quartile range",
  ]},

  // ────────────────────────────────────────────────────────────────────
  // AQA GCSE English Language (9-1) — 60142923
  // Spec: AQA 8700
  // ────────────────────────────────────────────────────────────────────
  { qan: "60142923", topic: "Reading", objectives: [
    "Identify and interpret explicit and implicit information and ideas; select and synthesise from different texts",
    "Explain, comment on and analyse how writers use language and structure to achieve effects, using relevant subject terminology",
    "Compare writers' ideas and perspectives across two or more texts",
    "Evaluate texts critically, supporting with appropriate textual references",
    "Read and understand a range of non-fiction and literary non-fiction texts from the 19th, 20th and 21st centuries",
  ]},
  { qan: "60142923", topic: "Writing", objectives: [
    "Communicate clearly, effectively and imaginatively, selecting and adapting tone, style and register for different forms, purposes and audiences",
    "Organise information and ideas, using structural and grammatical features to support coherence and cohesion of texts",
    "Use a range of vocabulary and sentence structures for clarity, purpose and effect, with accurate spelling and punctuation",
    "Write for a range of purposes and audiences: narratives, descriptions, arguments, explanations, instructions, letters, articles, speeches",
  ]},
  { qan: "60142923", topic: "Spoken Language", objectives: [
    "Present information and ideas: select and organise, using Standard English where appropriate",
    "Listen and respond appropriately to spoken language, including questions and feedback on presentations",
    "Use spoken Standard English effectively in speeches and presentations",
  ]},

  // ────────────────────────────────────────────────────────────────────
  // AQA GCSE Biology (9-1) — 60187529
  // Spec: AQA 8461
  // ────────────────────────────────────────────────────────────────────
  { qan: "60187529", topic: "Cell biology", objectives: [
    "Describe the structure of eukaryotic and prokaryotic cells; explain how electron microscopy has increased understanding of subcellular structures",
    "Explain how the main subcellular structures of eukaryotic and prokaryotic cells are related to their functions",
    "Explain how cells may be specialised to carry out a particular function",
    "Describe cell division by mitosis; explain the importance of cell division in growth, repair and asexual reproduction",
    "Describe the process of stem cell differentiation; discuss the potential risks and benefits of stem cell use in medicine",
    "Explain how substances are transported into and out of cells by diffusion, osmosis and active transport",
  ]},
  { qan: "60187529", topic: "Organisation", objectives: [
    "Describe the levels of organisation within organisms: cells, tissues, organs, organ systems, organisms",
    "Explain the role of enzymes in digestion and describe enzyme action as a model (lock and key)",
    "Describe the structures of the human heart and lungs, and explain how they are adapted for gas exchange and transport",
    "Explain how the organisation of the human digestive system enables efficient digestion and absorption",
    "Describe the components and functions of blood; explain how red blood cells, white blood cells and platelets are adapted",
    "Describe plant organ systems for transport (xylem and phloem) and explain transpiration and translocation",
  ]},
  { qan: "60187529", topic: "Infection and response", objectives: [
    "Explain how communicable diseases are caused by pathogens (bacteria, viruses, fungi, protists) and describe how they spread",
    "Explain the role of the immune system in defending against pathogens; describe the non-specific and specific immune responses",
    "Describe how vaccination works and explain the concept of herd immunity",
    "Explain the use of antibiotics and painkillers; describe the development of drug resistance in bacteria",
    "Describe the process of developing and testing new drugs, including preclinical and clinical trials",
  ]},
  { qan: "60187529", topic: "Bioenergetics", objectives: [
    "Describe photosynthesis as an endothermic reaction; write the word and symbol equations",
    "Explain the effect of temperature, light intensity and CO₂ concentration on the rate of photosynthesis",
    "Describe aerobic and anaerobic respiration; compare the energy released by each process",
    "Explain the body's response to exercise including oxygen debt and the role of anaerobic respiration in muscles",
  ]},
  { qan: "60187529", topic: "Homeostasis and response", objectives: [
    "Describe homeostasis as the regulation of internal conditions to maintain optimum conditions for enzyme action and cell functions",
    "Describe the structure and function of the nervous system; explain the reflex arc",
    "Describe the principles of hormonal coordination and control in humans, including the role of the endocrine system",
    "Explain how blood glucose concentration is controlled by insulin and glucagon; describe Type 1 and Type 2 diabetes",
    "Describe the roles of hormones in human reproduction including the menstrual cycle, contraception and fertility treatments",
    "Describe plant hormones (auxins, gibberellins, ethene) and their roles in phototropism and gravitropism",
  ]},
  { qan: "60187529", topic: "Inheritance, variation and evolution", objectives: [
    "Describe DNA structure and its role in protein synthesis; explain the concept of the genome and its importance",
    "Describe the process of meiosis and explain how it leads to genetic variation",
    "Explain Mendelian genetics: dominant, recessive, homozygous, heterozygous; construct and interpret genetic diagrams including Punnett squares",
    "Describe variation as a result of genetic and environmental factors; explain the role of mutations",
    "Explain Darwin's theory of evolution by natural selection; describe the evidence for evolution including fossils and antibiotic resistance",
    "Describe selective breeding and genetic engineering; evaluate their benefits and risks",
    "Describe classification systems and explain how they have changed due to advances in understanding including the three-domain system",
  ]},
  { qan: "60187529", topic: "Ecology", objectives: [
    "Describe the different levels of organisation in an ecosystem: species, population, community, habitat, ecosystem",
    "Explain how organisms are adapted to live in their natural environment and the concept of competition",
    "Describe how to carry out a field investigation; use sampling techniques such as quadrats and transects",
    "Describe the carbon and water cycles; explain the role of decomposers in recycling materials",
    "Explain the impact of human activities on biodiversity; describe programmes to maintain biodiversity",
    "Describe the advantages and disadvantages of maintaining food security, including the use of biotechnology",
  ]},

  // ────────────────────────────────────────────────────────────────────
  // AQA GCSE Chemistry (9-1) — 60187578
  // Spec: AQA 8462
  // ────────────────────────────────────────────────────────────────────
  { qan: "60187578", topic: "Atomic structure and the periodic table", objectives: [
    "Describe the structure of the atom (protons, neutrons, electrons) and their properties; calculate atomic and mass numbers",
    "Explain the development of the atomic model from Dalton to Bohr to the modern model",
    "Describe the arrangement of elements in the periodic table; explain how electronic structure relates to position",
    "Explain the properties of alkali metals, halogens and noble gases in terms of electronic structure",
    "Describe the difference between metals and non-metals and their typical properties",
  ]},
  { qan: "60187578", topic: "Bonding, structure and properties of matter", objectives: [
    "Describe ionic bonding as electrostatic attraction between oppositely charged ions; draw dot-and-cross diagrams",
    "Describe covalent bonding; draw dot-and-cross diagrams for small molecules and explain properties of simple molecular substances",
    "Describe metallic bonding and use it to explain properties of metals and alloys",
    "Explain the properties of giant covalent structures (diamond, graphite, graphene, fullerenes)",
    "Explain how bonding and structure relate to the properties of a substance including melting point, solubility and conductivity",
    "Describe nanoparticles and their properties; discuss applications and potential risks of nanoscience",
  ]},
  { qan: "60187578", topic: "Quantitative chemistry", objectives: [
    "Calculate relative formula mass; determine the mass of a given number of moles of a substance",
    "Use the mole concept to calculate masses, concentrations and volumes in reactions",
    "Balance chemical equations and interpret them in terms of moles",
    "Calculate percentage yield, atom economy and concentration of solutions",
    "Explain the concept of limiting reactants and use it in calculations",
  ]},
  { qan: "60187578", topic: "Chemical changes", objectives: [
    "Explain oxidation and reduction in terms of electron transfer; identify redox reactions",
    "Describe the reactivity series and use it to predict reactions; explain extraction methods for metals",
    "Describe neutralisation reactions between acids and alkalis/bases/carbonates; write ionic equations",
    "Describe the production of soluble salts from acids and explain the process of titration",
    "Explain strong and weak acids in terms of ionisation; use the pH scale and describe indicators",
    "Describe electrolysis of molten compounds and aqueous solutions; predict products at each electrode",
  ]},
  { qan: "60187578", topic: "Energy changes", objectives: [
    "Describe exothermic and endothermic reactions; draw and interpret energy profile diagrams",
    "Calculate energy changes using bond energies; explain activation energy",
    "Describe the use of hydrogen fuel cells and evaluate their advantages and disadvantages",
  ]},
  { qan: "60187578", topic: "The rate and extent of chemical change", objectives: [
    "Describe factors affecting rate of reaction: concentration, pressure, surface area, temperature, catalysts",
    "Explain rates of reaction in terms of collision theory and activation energy",
    "Calculate rates of reaction from experimental data; interpret rate graphs",
    "Describe reversible reactions and dynamic equilibrium; predict the effect of changing conditions using Le Chatelier's principle",
  ]},
  { qan: "60187578", topic: "Organic chemistry", objectives: [
    "Describe crude oil as a mixture of hydrocarbons; explain fractional distillation and cracking",
    "Describe the general formulae, structures and properties of alkanes and alkenes",
    "Describe addition and condensation polymerisation; explain the properties and uses of polymers",
    "Describe alcohols, carboxylic acids and esters; explain their reactions and uses",
  ]},
  { qan: "60187578", topic: "Chemical analysis", objectives: [
    "Describe the difference between pure substances and mixtures; interpret melting and boiling point data",
    "Describe and explain techniques for separating mixtures: chromatography, filtration, crystallisation, distillation",
    "Describe tests for common gases (hydrogen, oxygen, carbon dioxide, chlorine)",
    "Identify ions using chemical tests: flame tests, sodium hydroxide precipitation, and tests for carbonates, halides and sulfates",
  ]},
  { qan: "60187578", topic: "Chemistry of the atmosphere", objectives: [
    "Describe the composition of the Earth's atmosphere and how it has changed over time",
    "Explain the greenhouse effect and describe the impact of human activities on climate change",
    "Describe the formation and effects of carbon monoxide, sulfur dioxide, nitrogen oxides and particulates as atmospheric pollutants",
  ]},
  { qan: "60187578", topic: "Using resources", objectives: [
    "Describe the finite nature of the Earth's resources and the importance of sustainable development",
    "Describe the treatment of water for domestic use and evaluate methods of water treatment including desalination",
    "Evaluate methods of reducing the use of resources including reduce, reuse and recycle",
    "Describe life cycle assessments and explain how they are used to evaluate the environmental impact of products",
    "Describe the Haber process for making ammonia; explain how conditions are chosen to balance rate and yield",
    "Describe the use of NPK fertilisers and explain their importance for food production",
  ]},

  // ────────────────────────────────────────────────────────────────────
  // AQA GCSE Physics (9-1) — 60187517
  // Spec: AQA 8463
  // ────────────────────────────────────────────────────────────────────
  { qan: "60187517", topic: "Energy", objectives: [
    "Describe energy stores and transfers; calculate kinetic, gravitational potential and elastic potential energy",
    "Describe the conservation of energy principle; calculate efficiency and power",
    "Describe thermal conductivity and specific heat capacity; calculate energy changes in heating",
    "Describe energy resources (renewable and non-renewable) and evaluate their use for electricity generation",
  ]},
  { qan: "60187517", topic: "Electricity", objectives: [
    "Describe current, potential difference and resistance; use and apply Ohm's law and V = IR",
    "Describe the characteristics of series and parallel circuits; calculate total resistance",
    "Describe the I-V characteristics of resistors, filament lamps, diodes and LDRs/thermistors",
    "Describe the relationship between power, current, potential difference and resistance: P = IV, P = I²R",
    "Describe energy transfers in electrical circuits; calculate energy transferred: E = Pt, E = QV",
    "Describe the functions of the live, neutral and earth wires; explain the role of fuses and circuit breakers in electrical safety",
    "Describe the National Grid and explain how transformers are used in electricity transmission",
  ]},
  { qan: "60187517", topic: "Particle model of matter", objectives: [
    "Describe the particle model and use it to explain states of matter, density and changes of state",
    "Calculate density using ρ = m/V; describe an experiment to measure the density of regular and irregular objects",
    "Describe internal energy and how it relates to temperature and changes of state; explain latent heat",
    "Calculate energy for changes of state: Q = mL; calculate energy for temperature changes: Q = mcΔθ",
    "Explain gas pressure in terms of the particle model; describe the effect of temperature and volume on pressure",
  ]},
  { qan: "60187517", topic: "Atomic structure", objectives: [
    "Describe the nuclear model of the atom; explain how the model has developed over time",
    "Describe the properties of alpha, beta and gamma radiation; explain their penetrating power and ionising ability",
    "Describe radioactive decay and half-life; calculate the activity or count rate after a given number of half-lives",
    "Describe nuclear fission and nuclear fusion; explain the conditions needed for each process",
    "Describe the hazards and uses of radioactive emissions; explain contamination vs irradiation",
  ]},
  { qan: "60187517", topic: "Forces", objectives: [
    "Describe scalar and vector quantities; represent forces as vectors and find the resultant of two forces",
    "Describe the relationship between force, mass and acceleration: F = ma; apply Newton's three laws of motion",
    "Describe and calculate moments; apply the principle of moments to balanced situations",
    "Calculate work done: W = Fs; describe the relationship between work done and energy transferred",
    "Describe Hooke's law and elastic deformation; calculate spring constant: F = ke",
    "Describe the factors affecting stopping distance; explain the relationship between braking force and deceleration",
    "Describe terminal velocity and the forces on falling objects; interpret velocity-time graphs",
    "Calculate pressure in fluids: p = F/A and p = hρg; describe atmospheric pressure and its variation with altitude",
  ]},
  { qan: "60187517", topic: "Waves", objectives: [
    "Describe transverse and longitudinal waves; use the wave equation: v = fλ",
    "Describe the properties of electromagnetic waves; explain uses and hazards of each region of the EM spectrum",
    "Describe reflection, refraction and diffraction of waves; draw ray diagrams for reflection and refraction",
    "Describe the properties of sound waves; explain how sound is detected by the ear and measured in decibels",
    "Describe how waves can be used for detection and exploration including ultrasound and seismic waves",
  ]},
  { qan: "60187517", topic: "Magnetism and electromagnetism", objectives: [
    "Describe the properties of magnets and magnetic fields; draw magnetic field lines for bar magnets and solenoids",
    "Describe the magnetic effect of a current; explain the factors affecting the strength of an electromagnet",
    "Describe the motor effect; calculate the force on a conductor: F = BIl; explain the operation of a DC motor",
    "Describe electromagnetic induction; explain the factors affecting the induced potential difference",
    "Describe the operation and use of transformers; apply the transformer equation: Vs/Vp = ns/np",
  ]},
  { qan: "60187517", topic: "Space physics", objectives: [
    "Describe the life cycle of a star from protostar to its final stage (white dwarf, neutron star or black hole)",
    "Describe the structure of our solar system and the Milky Way galaxy; explain how the Sun was formed",
    "Explain red shift and the Big Bang theory; describe the evidence for an expanding universe",
  ]},

  // ────────────────────────────────────────────────────────────────────
  // AQA GCSE Combined Science: Trilogy (9-1) — 6018758X
  // ────────────────────────────────────────────────────────────────────
  { qan: "6018758X", topic: "Combined Science overview", objectives: [
    "Biology, Chemistry and Physics content equivalent to the separate GCSE sciences but studied as a combined double award",
    "All topic areas from AQA GCSE Biology, Chemistry and Physics are covered at foundation and higher tier",
    "Students develop scientific thinking, experimental skills and mathematical skills across all three disciplines",
    "Assessment covers working scientifically skills: apparatus and techniques, data analysis, evaluation of methods",
  ]},

  // ────────────────────────────────────────────────────────────────────
  // AQA A-Level Mathematics — 60311642
  // Spec: AQA 7357
  // ────────────────────────────────────────────────────────────────────
  { qan: "60311642", topic: "Pure Mathematics – Proof", objectives: [
    "Construct proofs using mathematical induction; prove results by contradiction and by deduction",
    "Understand and use the structure of mathematical proof, including proof by exhaustion",
  ]},
  { qan: "60311642", topic: "Pure Mathematics – Algebra and functions", objectives: [
    "Manipulate polynomials algebraically; use the factor theorem and the remainder theorem",
    "Simplify rational expressions; decompose into partial fractions",
    "Use the modulus function; sketch graphs of y = |f(x)| and y = f(|x|)",
    "Understand and use composite and inverse functions; understand the effect of combinations of transformations on a graph",
  ]},
  { qan: "60311642", topic: "Pure Mathematics – Coordinate geometry", objectives: [
    "Use straight-line models; calculate distance, midpoint and gradient; find equations of parallel and perpendicular lines",
    "Understand the coordinate geometry of the circle: equation (x-a)² + (y-b)² = r²; find tangent and normal",
    "Use parametric equations of curves; convert between parametric and Cartesian forms",
  ]},
  { qan: "60311642", topic: "Pure Mathematics – Sequences and series", objectives: [
    "Use the binomial expansion of (1 + x)ⁿ for rational n; find terms using the general binomial coefficient",
    "Work with arithmetic and geometric sequences and series; find sums including sum to infinity",
    "Use sigma notation; derive and apply formulae for the sum of arithmetic and geometric series",
  ]},
  { qan: "60311642", topic: "Pure Mathematics – Trigonometry", objectives: [
    "Work with radian measure; use exact values of sin, cos and tan for standard angles",
    "Use the sine rule, cosine rule and area formula in problem-solving",
    "Understand and use sec, cosec and cot; use trigonometric identities and prove trigonometric results",
    "Solve trigonometric equations in given intervals; use the addition and double-angle formulae",
    "Use small-angle approximations; understand inverse trigonometric functions and their graphs",
  ]},
  { qan: "60311642", topic: "Pure Mathematics – Exponentials and logarithms", objectives: [
    "Know and use the function eˣ and its graph; know that ln x is the inverse function of eˣ",
    "Use the laws of logarithms: log(ab), log(a/b), log(aⁿ); solve equations of the form aˣ = b",
    "Use logarithmic graphs to estimate parameters in relationships y = axⁿ and y = kbˣ",
  ]},
  { qan: "60311642", topic: "Pure Mathematics – Differentiation", objectives: [
    "Differentiate xⁿ, eˣ, ln x, sin x, cos x, tan x and their sums, differences, products and quotients",
    "Use the chain rule, product rule and quotient rule; differentiate parametric and implicit equations",
    "Find second derivatives; use differentiation to find stationary points and determine their nature",
    "Form and solve differential equations; use differentiation in kinematics and optimisation problems",
  ]},
  { qan: "60311642", topic: "Pure Mathematics – Integration", objectives: [
    "Integrate xⁿ, eˣ, 1/x, sin x, cos x; use standard integrals and reverse chain rule",
    "Integrate using substitution and by parts; use partial fractions for integration",
    "Use definite integration to find areas under curves and between curves; use the trapezium rule",
    "Solve first-order differential equations by separation of variables",
  ]},
  { qan: "60311642", topic: "Pure Mathematics – Numerical methods", objectives: [
    "Locate roots of f(x) = 0 by considering changes of sign; use iteration methods xₙ₊₁ = g(xₙ)",
    "Use the Newton-Raphson method; understand its limitations",
    "Use numerical integration (trapezium rule) with increasing numbers of strips",
  ]},
  { qan: "60311642", topic: "Pure Mathematics – Vectors", objectives: [
    "Use vectors in two and three dimensions; calculate magnitude and direction",
    "Use vectors to solve geometric problems; find the equation of a line in vector form",
    "Use the scalar product of two vectors; determine whether vectors are perpendicular",
  ]},
  { qan: "60311642", topic: "Statistics", objectives: [
    "Use and interpret statistical diagrams and measures of location and spread",
    "Understand and apply the concepts of correlation and regression; interpret in context",
    "Calculate probabilities using the addition and multiplication rules; use tree diagrams and Venn diagrams",
    "Understand and use the binomial distribution as a model; calculate probabilities using the binomial",
    "Understand and use the Normal distribution as a model; find probabilities using the Normal distribution",
    "Conduct and interpret hypothesis tests for the proportion (binomial) and the mean (Normal)",
  ]},
  { qan: "60311642", topic: "Mechanics", objectives: [
    "Use vectors to model forces; resolve forces and find resultants in 2D",
    "Understand and use Newton's laws of motion; solve problems involving F = ma",
    "Use the constant acceleration (SUVAT) equations; interpret and sketch kinematics graphs",
    "Understand and use moments; solve problems involving equilibrium of rigid bodies",
    "Model motion with variable force and acceleration using calculus",
  ]},
];

// ── Flatten and insert ─────────────────────────────────────────────────
const rows = [];
for (const group of OBJECTIVES) {
  for (const text of group.objectives) {
    rows.push({
      qan_code: group.qan,
      topic_area: group.topic,
      objective_text: text,
    });
  }
}

console.log(`Seeding ${rows.length} objectives across ${OBJECTIVES.length} topic groups...\n`);

// Count by QAN
const byQan = {};
rows.forEach(r => { byQan[r.qan_code] = (byQan[r.qan_code] || 0) + 1; });

// Upsert in batches (delete existing first to avoid duplicates)
const qans = [...new Set(rows.map(r => r.qan_code))];
for (const qan of qans) {
  // Delete existing objectives for this QAN
  await supabase.from("curriculum_objectives").delete().eq("qan_code", qan);
}

const BATCH = 200;
let inserted = 0;
for (let i = 0; i < rows.length; i += BATCH) {
  const chunk = rows.slice(i, i + BATCH);
  const { error } = await supabase.from("curriculum_objectives").insert(chunk);
  if (error) {
    console.error("Insert error:", error.message);
  } else {
    inserted += chunk.length;
  }
}

console.log(`✓ Inserted ${inserted} objectives\n`);
for (const [qan, count] of Object.entries(byQan)) {
  // Look up the title
  const { data } = await supabase.from("qualifications").select("title, board").eq("qan_code", qan).single();
  console.log(`  ${qan} | ${data?.board?.padEnd(7)} | ${count} objectives | ${data?.title}`);
}
