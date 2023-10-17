import { useEffect, useState } from 'react';
import { Rating } from 'react-simple-star-rating';

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);
const KEY = '8b77671d';

export default function App() {
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const [watched, setWatched] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  function handleQuery(query) {
    setQuery(query);
  }

  function handleSelectedId(id) {
    setSelectedId(id);
  }

  function handleCloseMovie() {
    setSelectedId(null);
  }

  function handleAddWatched(movie) {
    setWatched((watched) => [...watched, movie]);
  }

  function handleRemoveWatched(id) {
    setWatched((watched) => watched.filter((movie) => movie.imdbID !== id));
  }

  useEffect(
    function () {
      const controller = new AbortController();
      async function fetchMovie() {
        try {
          setError('');
          setIsLoading(true);
          const res = await fetch(
            `http://www.omdbapi.com/?apikey=${KEY}&s=${query}`,
            { signal: controller.signal }
          );
          if (!res.ok) throw new Error('Something went wrong!');
          const data = await res.json();
          if (data.Response === 'False') throw new Error('Movie not found!');
          setMovies(data.Search);
        } catch (err) {
          if (err.name === 'AbortError') {
            setError('');
            return;
          }
          console.error(err);
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      }
      if (!query.length) {
        setMovies([]);
        setError('');
        return;
      }
      handleCloseMovie();
      fetchMovie();
      return () => controller.abort();
    },
    [query]
  );

  return (
    <>
      <NavBar>
        <Logo />
        <Search query={query} onQuery={handleQuery} />
        <MovieNum movies={movies} />
      </NavBar>
      <Main>
        <Box>
          {isLoading && <Loader />}
          {!isLoading && error && <ErrorMessage error={error} />}
          {!isLoading && !error && (
            <MovieList
              movies={movies}
              onSelectedId={handleSelectedId}
              selectedId={selectedId}
            />
          )}
        </Box>
        <Box>
          {selectedId ? (
            <MovieDetail
              selectedId={selectedId}
              onCloseMovie={handleCloseMovie}
              onAddWatched={handleAddWatched}
              watched={watched}
            />
          ) : (
            <>
              <WatchedMovieSum watched={watched} />
              <WatchedMovieList
                watched={watched}
                onRemoveWatched={handleRemoveWatched}
              />
            </>
          )}
        </Box>
      </Main>
    </>
  );
}

function NavBar({ children }) {
  return <nav className='nav-bar'>{children}</nav>;
}

function Logo() {
  return (
    <div className='logo'>
      <span role='img'>🍿</span>
      <h1>Popcorn</h1>
    </div>
  );
}

function Search({ query, onQuery }) {
  function handleQuery(query) {
    onQuery(query);
  }
  return (
    <input
      className='search'
      type='text'
      placeholder='Search movies...'
      value={query}
      onChange={(e) => handleQuery(e.target.value)}
    />
  );
}

function MovieNum({ movies }) {
  return (
    <p className='num-results'>
      Found <strong>{movies.length}</strong> results
    </p>
  );
}

function Main({ children }) {
  return <main className='main'>{children}</main>;
}

function Box({ children }) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className='box'>
      <button className='btn-toggle' onClick={() => setIsOpen((open) => !open)}>
        {isOpen ? '–' : '+'}
      </button>
      {isOpen && children}
    </div>
  );
}

function MovieList({ movies, onSelectedId, selectedId }) {
  return (
    <ul className='list list-movies'>
      {movies?.map((movie) => (
        <Movie
          movie={movie}
          onSelectedId={onSelectedId}
          selectedId={selectedId}
          key={movie.imdbID}
        />
      ))}
    </ul>
  );
}

function Movie({ movie, onSelectedId, selectedId }) {
  function handleSelectedId(id) {
    onSelectedId(id === selectedId ? null : id);
  }
  return (
    <li onClick={() => handleSelectedId(movie.imdbID)} key={movie.imdbID}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>🗓</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
}

function Loader() {
  return <div className='loader'></div>;
}

function ErrorMessage({ error }) {
  return <p className='error'>⛔{error}</p>;
}

function WatchedMovieSum({ watched }) {
  const avgImdbRating = average(watched.map((movie) => +movie.imdbRating || 0));
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const avgRuntime = average(
    watched.map((movie) => parseInt(movie.Runtime) || 0)
  );
  return (
    <div className='summary'>
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating.toFixed(1)}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating.toFixed(1)}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{avgRuntime.toFixed(1)} min</span>
        </p>
      </div>
    </div>
  );
}

function WatchedMovieList({ watched, onRemoveWatched }) {
  return (
    <ul className='list list-watched'>
      {watched.map((movie) => (
        <WatchedMovie
          movie={movie}
          key={movie.imdbID}
          onRemoveWatched={onRemoveWatched}
        />
      ))}
    </ul>
  );
}

function WatchedMovie({ movie, onRemoveWatched }) {
  function handleRemoveWatched() {
    onRemoveWatched(movie.imdbID);
  }
  return (
    <li key={movie.imdbID}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>⭐️</span>
          <span>{movie.imdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{movie.userRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{movie.Runtime}</span>
        </p>
      </div>
      <button className='btn-delete' onClick={handleRemoveWatched}>
        X
      </button>
    </li>
  );
}

function MovieDetail({ selectedId, onCloseMovie, onAddWatched, watched }) {
  const [movie, setMovie] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [rating, setRating] = useState(null);
  const currentRating = watched.find(
    (movie) => movie.imdbID === selectedId
  )?.userRating;

  function handleCloseMovie() {
    onCloseMovie();
  }
  function handleRating(rating) {
    setRating(rating);
  }

  function handleAddWatched() {
    onAddWatched({ ...movie, userRating: rating });
    onCloseMovie();
  }

  useEffect(
    function () {
      async function getMovieDetail() {
        try {
          setIsLoading(true);
          const res = await fetch(
            `http://www.omdbapi.com/?apikey=${KEY}&i=${selectedId}`
          );
          if (!res.ok) throw new Error('Movie not found!');
          const data = await res.json();
          setMovie(data);
        } catch (err) {
          console.error(err.message);
        } finally {
          setIsLoading(false);
        }
      }
      getMovieDetail();
    },
    [selectedId]
  );

  useEffect(
    function () {
      document.title = `Movie | ${movie.Title}`;
      return () => (document.title = 'Popcorn');
    },
    [movie]
  );

  useEffect(
    function () {
      const callback = function (e) {
        if (e.code !== 'Escape') return;
        onCloseMovie();
      };
      document.addEventListener('keydown', callback);
      return () => document.removeEventListener('keydown', callback);
    },
    [selectedId, onCloseMovie]
  );

  return (
    <div className='details'>
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <header>
            <button className='btn-back' onClick={handleCloseMovie}>
              &larr;
            </button>
            <img src={movie.Poster} alt={`Poster of ${movie.Title} movie`} />
            <div className='details-overview'>
              <h2>{movie.Title}</h2>
              <p>
                {movie.Year} &bull; {movie.Runtime}
              </p>
              <p>{movie.Genre}</p>
              <p>
                <span>⭐</span>
                {movie.imdbRating} IMDb rating
              </p>
            </div>
          </header>
          <section>
            <div className='rating'>
              {!currentRating ? (
                <>
                  <Rating
                    size={26}
                    iconsCount={10}
                    showTooltip={true}
                    tooltipArray={[]}
                    tooltipDefaultText=''
                    tooltipStyle={{
                      display: 'inline-block',
                      backgroundColor: 'transparent',
                      color: 'black',
                    }}
                    tooltipClassName='tooltip'
                    onClick={handleRating}
                  />
                  <button className='btn-add' onClick={handleAddWatched}>
                    + Add to list
                  </button>
                </>
              ) : (
                <p>You rated this movie {currentRating} ⭐</p>
              )}
            </div>
            <p>
              <em>{movie.Plot}</em>
            </p>
            <p>Starring: {movie.Actors}</p>
            <p>Directed by {movie.Director}</p>
          </section>
        </>
      )}
    </div>
  );
}
