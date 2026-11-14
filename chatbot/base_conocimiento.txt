% Base de conocimiento: idiomas del mundo
% Aca van solo los hechos y reglas del dominio. Lo que entiende y
% responde el chatbot esta en chatbot.pl

:- discontiguous es/2.

% Familias de idiomas

dialecto_de(espanol, chileno).
es(ingles, germanico).
es(aleman, germanico).
es(holandes, germanico).
es(noruego, germanico).
es(sueco, germanico).

es(espanol, romance).
es(frances, romance).
es(italiano, romance).
es(portugues, romance).

es(mandarin, grupo_mandarin).
es(cantones, grupo_yue).
es(shanganes, grupo_wu).

es(finlandes, uralico).
es(ruso, eslavo).
es(japones, japonico).
es(coreano, coreanico).
es(turco, turquico).

% Paises y lugares donde se habla cada idioma
se_habla(reino_unido, ingles).
se_habla(estados_unidos, ingles).
se_habla(inglaterra, ingles).
se_habla(alemania, aleman).
se_habla(paises_bajos, holandes).
se_habla(noruega, noruego).
se_habla(suecia, sueco).

se_habla(chile, espanol).
se_habla(mexico, espanol).
se_habla(espana, espanol).
se_habla(francia, frances).
se_habla(italia, italiano).
se_habla(brasil, portugues).

se_habla(finlandia, finlandes).
se_habla(rusia, ruso).
se_habla(japon, japones).
se_habla(corea, coreano).
se_habla(turquia, turco).

se_habla(china, mandarin).
se_habla(hong_kong, cantones).
se_habla(shanghai, shanganes).

% Las macrofamilias se deducen a partir de las familias
es(X, indoeuropeo) :-
    es(X, germanico);
    es(X, romance);
    es(X, eslavo).

es(X, sinotibetanas) :-
    es(X, grupo_mandarin);
    es(X, grupo_wu);
    es(X, grupo_yue).

% Algo es un idioma si tiene familia o si es la lengua madre de otro
idioma(Idioma) :-
    es(Idioma, _).

idioma(Idioma) :-
    proviene(_, Idioma).

% De que lengua madre viene cada idioma, segun su familia
proviene(Idioma, latin) :-
    es(Idioma, romance).

proviene(Idioma, protogermanico) :-
    es(Idioma, germanico).

proviene(Idioma, protosinotibetano) :-
    es(Idioma, sinotibetanas).

proviene(Idioma, protouralico) :-
    es(Idioma, uralico).

proviene(Idioma, protoeslavo) :-
    es(Idioma, eslavo). 

proviene(Idioma, protojaponico) :-
    es(Idioma, japonico).

proviene(Idioma, protocoreanico) :-
    es(Idioma, coreanico).

proviene(Idioma, prototurquico) :-
    es(Idioma, turquico).

% Dos idiomas distintos estan relacionados si comparten alguna familia
idiomas_relacionados(Idioma1, Idioma2) :-
    es(Idioma1, Familia),
    es(Idioma2, Familia),
    Idioma1 \= Idioma2.

% Dos idiomas distintos tienen el mismo origen si comparten su lengua madre
mismo_origen(Idioma1, Idioma2) :-
    proviene(Idioma1, Origen),
    proviene(Idioma2, Origen),
    Idioma1 \= Idioma2.

posee_dialecto(Idioma) :-
    dialecto_de(Idioma, _).