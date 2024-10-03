export const mockTopRatedMovies = {
  results: [
    {
      id: 1,
      title: "Mock Movie 1",
      overview: "This is a mock overview for Mock Movie 1.",
      backdrop_path: "/mock_backdrop_1.jpg",
      poster_path: "/mock_poster_1.jpg",
      release_date: "2023-01-01",
      vote_average: 8.5,
    },
    {
      id: 2,
      title: "Mock Movie 2",
      overview: "This is a mock overview for Mock Movie 2.",
      backdrop_path: "/mock_backdrop_2.jpg",
      poster_path: "/mock_poster_2.jpg",
      release_date: "2023-02-01",
      vote_average: 7.9,
    },
  ],
  total_pages: 10,
}

export const mockMovie = {
  id: 1,
  title: "Mock Movie 1",
  overview: "This is a detailed mock overview for Mock Movie 1.",
  backdrop_path: "/mock_backdrop_1.jpg",
  poster_path: "/mock_poster_1.jpg",
  release_date: "2023-01-01",
  vote_average: 8.5,
  runtime: 120,
  credits: {
    cast: [
      {
        id: 101,
        name: "Actor One",
        character: "Character One",
        profile_path: "/actor_one_profile.jpg",
      },
      {
        id: 102,
        name: "Actor Two",
        character: "Character Two",
        profile_path: null,
      },
    ],
  },
}
