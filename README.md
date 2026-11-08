# Práctica de GraphQL con la Countries API

API pública (solo consultas): <https://countries.trevorblades.com>

Ábrela en el Apollo Sandbox y escribe cada consulta. Las 5 marcadas con **Solución** traen la respuesta oculta; intenta primero y luego despliégala.

## Básicas

1. Obtener el nombre y la capital de Colombia (`CO`).
2. Obtener el código y el nombre de todos los continentes.
3. Obtener el nombre y el emoji de todos los países de Suramérica (`SA`). **Solución**

<details>
<summary>Ver solución</summary>

```graphql
query {
  continent(code: "SA") {
    countries {
      name
      emoji
    }
  }
}
```

</details>

4. Obtener el nombre y el nombre nativo de Japón (`JP`).
5. Obtener la moneda y el prefijo telefónico de México (`MX`).
6. Obtener todos los idiomas con su nombre y si se escriben de derecha a izquierda (`rtl`).

## Datos anidados

7. Obtener Brasil (`BR`) con su nombre, el nombre de su continente y los nombres de sus idiomas. **Solución**

<details>
<summary>Ver solución</summary>

```graphql
query {
  country(code: "BR") {
    name
    continent {
      name
    }
    languages {
      name
    }
  }
}
```

</details>

8. Obtener los nombres de los estados (`states`) de Estados Unidos (`US`).
9. Obtener los países de Europa (`EU`) con su capital y su moneda.
10. Obtener el idioma español (`es`) con los nombres de los países donde se habla. **Solución**

<details>
<summary>Ver solución</summary>

```graphql
query {
  language(code: "es") {
    name
    countries {
      name
    }
  }
}
```

</details>

11. Obtener todos los continentes con los nombres de sus países.
12. Obtener los idiomas de Suiza (`CH`) con su nombre y su nombre nativo.

## Filtros

13. Obtener los nombres de los países cuyo nombre empieza por «Co». **Solución**

<details>
<summary>Ver solución</summary>

```graphql
query {
  countries(filter: { name: { regex: "^Co" } }) {
    name
  }
}
```

</details>

14. Obtener los nombres de los países cuyo código es `CO`, `AR` o `PE`.
15. Obtener los nombres de los países cuya moneda es el euro (`EUR`).
16. Obtener los nombres de los países cuyo continente es Asia (`AS`), con su moneda.

## Variables, alias y fragmentos

17. Obtener un país por código usando una variable (`$code`), con su nombre y su capital.
18. Obtener Colombia y Argentina en una sola consulta usando alias (`col` y `arg`), con nombre y capital. **Solución**

<details>
<summary>Ver solución</summary>

```graphql
query {
  col: country(code: "CO") {
    name
    capital
  }
  arg: country(code: "AR") {
    name
    capital
  }
}
```

</details>

19. Obtener las subdivisiones (`subdivisions`) de España (`ES`) con su nombre.
20. Obtener el nombre y la capital de México y de Perú reutilizando un fragmento (`fragment`).
